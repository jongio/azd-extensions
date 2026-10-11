import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const directory = resolve(root, 'schemas', 'v1.2');
const azureCommit = '3440050737c18537ae6cdbd1d64b98c594c495ad';
const appCommit = 'a052d020ec1237ddbf922dfe6baa87e0a6b52b37';
const promoteCommit = '7dbee487cc96ad8650ce4c9285972b68b82775dc';
const raw = (repo, commit, path) => `https://raw.githubusercontent.com/${repo}/${commit}/${path}`;
const canonical = 'https://raw.githubusercontent.com/jongio/azd-extensions/main/schemas/v1.2/';
const manifestPath = resolve(directory, 'sources', 'manifest.json');
const download = process.argv.includes('--download');
const integrate = process.argv.includes('--integrate-pr');
const check = process.argv.includes('--check');
const manifest = download ? [] : JSON.parse(readFileSync(manifestPath, 'utf8'));

function write(path, content) {
  const text = typeof content === 'string' ? content : `${JSON.stringify(content, null, 2)}\n`;
  if (check) {
    if (readFileSync(path, 'utf8') !== text) throw new Error(`Generated file is stale: ${path}`);
  } else {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  }
}

function source(repo, commit, path) {
  const local = `sources/${repo.split('/')[1]}/${path}${path.endsWith('.test.js') ? '.txt' : ''}`;
  const target = resolve(directory, ...local.split('/'));
  let bytes;
  if (download || (integrate && !manifest.some((entry) => entry.repo === repo && entry.commit === commit && entry.path === path))) {
    const result = JSON.parse(execFileSync('gh', ['api', `repos/${repo}/contents/${path}?ref=${commit}`], { encoding: 'utf8' }));
    bytes = Buffer.from(result.content, 'base64');
    const blob = createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex');
    if (blob !== result.sha) throw new Error(`Blob mismatch: ${path}`);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, bytes);
    manifest.push({ repo, commit, path, file: local, uri: raw(repo, commit, path), blob, sha256: createHash('sha256').update(bytes).digest('hex') });
  } else {
    bytes = readFileSync(target);
    const entry = manifest.find((item) => item.repo === repo && item.commit === commit && item.path === path);
    if (!entry || createHash('sha256').update(bytes).digest('hex') !== entry.sha256) throw new Error(`Unverified source: ${path}`);
    if (integrate) entry.file = local;
  }
  return path.endsWith('.json') ? JSON.parse(bytes) : bytes.toString('utf8');
}

function visit(value, action) {
  if (!value || typeof value !== 'object') return;
  action(value);
  for (const [key, child] of Object.entries(value)) {
    if (!['examples', 'default', 'enum', 'const'].includes(key)) visit(child, action);
  }
}

const upstream = source('Azure/azure-dev', azureCommit, 'schemas/v1.0/azure.yaml.json');
const app = source('jongio/azd-app', appCommit, 'schemas/v1.1/azure.yaml.json');
const candidate = source('jongio/azd-extensions', promoteCommit, 'schemas/v1.2/azure.yaml.json');
const external = new Map();
const pending = [];
visit(upstream, (node) => {
  if (typeof node.$ref === 'string' && node.$ref.startsWith('https:')) pending.push(node.$ref);
});
while (pending.length) {
  const uri = pending.shift();
  const path = uri.replace(/^https:\/\/raw\.githubusercontent\.com\/Azure\/azure-dev\/(?:main|refs\/heads\/main)\//, '').split('#')[0];
  if (path === uri) throw new Error(`Undeclared upstream repository: ${uri}`);
  if (external.has(path)) continue;
  const schema = source('Azure/azure-dev', azureCommit, path);
  external.set(path, schema);
  const base = schema.$id || raw('Azure/azure-dev', 'main', path);
  visit(schema, (node) => {
    if (typeof node.$ref === 'string' && !node.$ref.startsWith('#')) pending.push(new URL(node.$ref, base).href);
  });
}

const vendorUri = (path) => `${canonical}vendor/${path}`;
function rebase(schema, path) {
  const oldBase = schema.$id || raw('Azure/azure-dev', 'main', path);
  visit(schema, (node) => {
    if (typeof node.$ref !== 'string' || node.$ref.startsWith('#')) return;
    const url = new URL(node.$ref, oldBase);
    const sourcePath = url.pathname.replace(/^\/Azure\/azure-dev\/(?:main|refs\/heads\/main)\//, '');
    if (!external.has(sourcePath)) throw new Error(`Missing reference: ${url}`);
    node.$ref = vendorUri(sourcePath) + url.hash;
  });
  schema.$id = vendorUri(path);
  return schema;
}
for (const [path, schema] of external) write(resolve(directory, 'vendor', ...path.split('/')), rebase(schema, path));
rebase(upstream, 'schemas/v1.0/azure.yaml.json');

const legacyId = `${canonical}legacy-app.schema.json`;
app.$id = legacyId;
visit(app, (node) => {
  if (typeof node.$ref === 'string' && node.$ref.startsWith('https:')) {
    const path = node.$ref.replace(/^https:\/\/raw\.githubusercontent\.com\/Azure\/azure-dev\/(?:main|refs\/heads\/main)\//, '');
    if (!external.has(path)) throw new Error(`Missing legacy resource: ${path}`);
    node.$ref = vendorUri(path);
  }
});
write(resolve(directory, 'legacy-app.schema.json'), app);

const definitions = {};
const queue = ['promoteConfig'];
while (queue.length) {
  const name = queue.shift();
  if (definitions[name]) continue;
  if (!candidate.definitions[name]) throw new Error(`Missing promote definition: ${name}`);
  definitions[name] = structuredClone(candidate.definitions[name]);
  visit(definitions[name], (node) => {
    if (typeof node.$ref === 'string') {
      if (!node.$ref.startsWith('#/definitions/')) throw new Error(`Unexpected promote reference: ${node.$ref}`);
      queue.push(node.$ref.slice('#/definitions/'.length));
    }
  });
}
const fragmentId = `${canonical}promote.schema.json`;
write(resolve(directory, 'promote.schema.json'), {
  $schema: 'http://json-schema.org/draft-07/schema#',
  $id: fragmentId,
  $ref: '#/definitions/promoteConfig',
  definitions,
});

const legacyRef = (pointer) => ({ $ref: `${legacyId}#${pointer}` });
for (const name of ['reqs', 'logs', 'test']) upstream.properties[name] = legacyRef(`/properties/${name}`);
const nativeService = upstream.properties.services.additionalProperties;
for (const [name] of Object.entries(app.definitions.service.properties)) {
  if (!nativeService.properties[name]) nativeService.properties[name] = legacyRef(`/definitions/service/properties/${name}`);
}
upstream.properties.services.additionalProperties = {
  anyOf: [nativeService, legacyRef('/definitions/service')],
};
upstream.properties.resources = { anyOf: [upstream.properties.resources, legacyRef('/properties/resources')] };
upstream.properties.infra = { anyOf: [upstream.properties.infra, legacyRef('/properties/infra')] };
for (const hook of Object.values(upstream.properties.hooks.properties)) {
  const native = hook.$ref;
  delete hook.$ref;
  hook.anyOf = [{ $ref: native }, legacyRef('/definitions/hooks')];
}
upstream.definitions.appShellHook = legacyRef('/definitions/hook');
upstream.definitions.appCompatibleHook = {
  description: 'Single shell hook supported by azd app. Arrays remain schema-valid for legacy editor compatibility only; azd app does not execute arrays.',
  anyOf: [{ $ref: '#/definitions/appShellHook' }, { type: 'array', items: { $ref: '#/definitions/appShellHook' } }],
};
for (const event of ['prerun', 'postrun', 'prestop', 'poststop']) {
  upstream.properties.hooks.properties[event] = { $ref: '#/definitions/appCompatibleHook' };
}
upstream.properties.promote = { $ref: fragmentId };
upstream.properties.name.description = candidate.properties.name.description;
upstream.$id = `${canonical}azure.yaml.json`;
upstream.title = 'Azure Developer CLI and extensions compatibility schema v1.2';
upstream.description = 'Released azd 1.31.2 with azd-app v1.1 validation compatibility and the pinned strict azd-promote contract. Runtime selection is unchanged.';
write(resolve(directory, 'azure.yaml.json'), upstream);

const fixturePaths = download
  ? JSON.parse(execFileSync('gh', ['api', `repos/jongio/azd-extensions/git/trees/${promoteCommit}?recursive=1`], { encoding: 'utf8' })).tree
    .filter((entry) => entry.type === 'blob' && entry.path.startsWith('schemas/v1.2/fixtures/promote/')).map((entry) => entry.path)
  : manifest.filter((entry) => entry.repo === 'jongio/azd-extensions' && entry.path.startsWith('schemas/v1.2/fixtures/promote/')).map((entry) => entry.path);
for (const path of fixturePaths) {
  write(resolve(directory, 'fixtures', 'promote', ...path.split('/').slice(4)), source('jongio/azd-extensions', promoteCommit, path));
}
const specPath = 'docs/specs/azd-promote-schema-1.2-overhaul/spec.md';
const spec = source('jongio/azd-extensions', promoteCommit, specPath);
const integratedSpec = spec
  .replace('exact contract without aliases because the current promote schema is\nunreleased.', 'exact contract without aliases. Replacing the publicly available experimental\npromote schema is an intentional compatibility change requested for this reconciliation.')
  .replace('10. The promote contract is unreleased. Old spellings are rejected; there are no aliases,\n    deprecation windows, redirects, or compatibility parsing.', '10. The publicly available experimental promote contract is intentionally replaced.\n    Old spellings are rejected without aliases; consumers must migrate.')
  .replace('**Compatibility:** no aliases because the promote contract is unreleased.', '**Compatibility:** intentionally replace public experimental promote acceptance without aliases; document migration.')
  .replace('Existing experimental names and the stale v1.2 promote schema carry\n  no compatibility weight because the contract is unreleased. They are not\n  retained merely because code already exists.', 'Existing experimental names in the publicly available v1.2 schema carry\n  compatibility impact. Their removal is intentional and requires consumer\n  migration; native/app compatibility is preserved separately.')
  .replace('public release.', 'publication of the reconciled contract.')
  .replaceAll('unreleased experimental', 'previous experimental');
write(resolve(root, ...specPath.split('/')), `> **Integration note:** This design is integrated from #167 at \`${promoteCommit}\`.
> Its original statements that promote is unreleased describe that draft's historical
> decision, not the publication status of the existing v1.2 URL. This reconciliation
> intentionally replaces the publicly available experimental promote contract.
> The aggregate now uses Draft 2019-09 and a generated strict Draft-07 promote
> fragment, with real offline dependencies. Naming, property ownership, runtime
> semantics, and the canonical example below remain the integrated contract.
> See [the reconciled changelog](../../../schemas/v1.2/CHANGELOG.md) for compatibility,
> source ownership, and overlap with #167. No runtime, default schema selection,
> or release/registry changes are authorized by this integration.

${integratedSpec}`);
const originalTests = source('jongio/azd-extensions', promoteCommit, 'schemas/v1.2/promote-schema.test.js');
const oldCompiler = `    const schema = await loadSchema()
    const ajv = new Ajv({
      allErrors: true,
      strict: false,
      loadSchema: async () => ({ type: 'object', additionalProperties: true }),
    })
    addFormats(ajv)
    return ajv.compileAsync(schema)`;
const oldLoader = `  return JSON.parse(await readFile(schemaPath, 'utf8'))`;
if (!originalTests.includes(oldCompiler) || !originalTests.includes(oldLoader)) throw new Error('PR assertion adapter no longer matches audited source');
const adaptedTests = originalTests
  .replace("import Ajv from 'ajv'\nimport addFormats from 'ajv-formats'", "import { createSchemaValidator } from '../../scripts/lib/schema-validation.js'")
  .replace(oldCompiler, `    const registry = createSchemaValidator(directory)
    const schema = JSON.parse(await readFile(schemaPath, 'utf8'))
    return registry.compile(schema)`)
  .replace(oldLoader, `  const aggregate = JSON.parse(await readFile(schemaPath, 'utf8'))
  const fragment = JSON.parse(await readFile(join(directory, 'promote.schema.json'), 'utf8'))
  return { ...aggregate, definitions: { ...aggregate.definitions, ...fragment.definitions } }`);
write(resolve(directory, 'promote-schema.test.js'), adaptedTests);
if (download || integrate) write(manifestPath, manifest);
