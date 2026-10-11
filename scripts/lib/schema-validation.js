import { readFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import Ajv from 'ajv';
import Ajv2019 from 'ajv/dist/2019.js';
import draft07 from 'ajv/dist/refs/json-schema-draft-07.json' with { type: 'json' };
import addFormats from 'ajv-formats';

export function jsonFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return entry.name === 'sources' ? [] : jsonFiles(path);
    return entry.name.endsWith('.json') ? [path] : [];
  });
}

export function createSchemaValidator(directory) {
  function dialectResource(schema) {
    const copy = structuredClone(schema);
    if (copy.$schema !== 'http://json-schema.org/draft-07/schema#') return copy;
    function normalize(node) {
      if (!node || typeof node !== 'object') return;
      if (typeof node.$ref === 'string') {
        for (const key of Object.keys(node)) {
          if (!['$ref', '$id', '$schema', 'definitions', '$defs'].includes(key)) delete node[key];
        }
      }
      for (const [key, child] of Object.entries(node)) {
        if (!['examples', 'default', 'enum', 'const'].includes(key)) normalize(child);
      }
    }
    normalize(copy);
    return copy;
  }
  const resources = jsonFiles(directory).map((path) => ({
    path, schema: JSON.parse(readFileSync(path, 'utf8')),
  })).filter(({ schema }) => schema.$schema);
  const known = new Map();
  const dialects = new Set(['http://json-schema.org/draft-07/schema#', 'https://json-schema.org/draft/2019-09/schema']);
  for (const { path, schema } of resources) {
    if (!dialects.has(schema.$schema)) throw new Error(`Unsupported dialect in ${path}: ${schema.$schema}`);
    if (!schema.$id) throw new Error(`Missing schema ID: ${path}`);
    if (known.has(schema.$id)) throw new Error(`Duplicate schema ID: ${schema.$id}`);
    known.set(schema.$id, dialectResource(schema));
  }
  const loadSchema = async (uri) => {
    const schema = known.get(uri);
    if (!schema) throw new Error(`Unregistered schema reference: ${uri}`);
    return schema;
  };
  const options = { allErrors: true, strict: false, loadSchema };
  const draft = new Ajv(options);
  const modern = new Ajv2019(options);
  modern.addMetaSchema(draft07);
  for (const engine of [draft, modern]) addFormats(engine);
  return {
    resources,
    async compile(schema) {
      if (!dialects.has(schema.$schema)) throw new Error(`Unsupported dialect: ${schema.$schema}`);
      const engine = schema.$schema.includes('2019-09') ? modern : draft;
      if (!engine.validateSchema(schema)) throw new Error(`Invalid metaschema: ${engine.errorsText()}`);
      const registered = known.get(schema.$id);
      const resource = registered && JSON.stringify(schema) === JSON.stringify(resources.find((item) => item.schema.$id === schema.$id).schema)
        ? registered : dialectResource(schema);
      return engine.getSchema(schema.$id) || engine.compileAsync(resource);
    },
  };
}

export function verifySources(directory) {
  const manifest = JSON.parse(readFileSync(resolve(directory, 'sources', 'manifest.json'), 'utf8'));
  for (const entry of manifest) {
    if (!/^[a-f0-9]{40}$/.test(entry.commit) || !entry.uri.includes(`/${entry.commit}/`)) throw new Error(`Mutable source: ${entry.uri}`);
    const bytes = readFileSync(resolve(directory, ...entry.file.split('/')));
    const hash = createHash('sha256').update(bytes).digest('hex');
    const blob = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    if (hash !== entry.sha256 || blob !== entry.blob) throw new Error(`Source hash mismatch: ${entry.file}`);
  }
}
