import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { beforeAll, describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { createSchemaValidator, verifySources } from '../../scripts/lib/schema-validation.js';

const directory = dirname(fileURLToPath(import.meta.url));
const read = (path) => JSON.parse(readFileSync(join(directory, path), 'utf8'));
let validate;
let fragment;
let native;
let legacy;
beforeAll(async () => {
  const registry = createSchemaValidator(directory);
  validate = await registry.compile(read('azure.yaml.json'));
  fragment = await registry.compile(read('promote.schema.json'));
  native = await registry.compile({
    ...read('azure.yaml.json'),
    $id: 'https://example.test/native',
    properties: {
      ...read('azure.yaml.json').properties,
      services: { type: 'object', additionalProperties: read('azure.yaml.json').properties.services.additionalProperties.anyOf[0] },
    },
  });
  legacy = await registry.compile(read('legacy-app.schema.json'));
});

describe('versioned compatibility contract', () => {
  it('verifies immutable inputs and reproducible generated output', () => {
    verifySources(directory);
    execFileSync(process.execPath, ['scripts/generate-v12-schema.js', '--check']);
    expect(read('azure.yaml.json').$id).toBe('https://raw.githubusercontent.com/jongio/azd-extensions/main/schemas/v1.2/azure.yaml.json');
    expect(read('sources/azd-app/schemas/v1.1/azure.yaml.json').$id).toContain('azd-app');
  });

  for (const event of ['prerun', 'postrun', 'prestop', 'poststop']) {
    it(`accepts single and legacy array ${event} but rejects native-only local fields`, () => {
      for (const hook of [{ run: 'echo ok', shell: 'bash' }, [{ run: 'echo ok' }], { windows: { run: 'echo ok', shell: 'cmd' }, posix: { run: 'echo ok' } }]) {
        expect(validate({ name: 'example', hooks: { [event]: hook } }), JSON.stringify(validate.errors)).toBe(true);
      }
      for (const hook of [{ run: 'test.js', kind: 'js' }, { run: 'echo ok', config: {} }, { windows: { windows: { run: 'echo no' } } }]) {
        expect(validate({ name: 'example', hooks: { [event]: hook } })).toBe(false);
      }
    });
  }

  it('supports native root, service and stable provisioning-layer hooks', () => {
    const hook = { kind: 'js', run: 'hooks.js', config: {} };
    for (const hooks of [hook, [hook], { windows: { run: 'hook.ts', kind: 'ts' }, posix: { run: 'hook.py', kind: 'python' } }]) {
      expect(validate({ name: 'example', hooks: { predeploy: hooks }, services: { web: { host: 'appservice', project: '.', hooks: { prebuild: hooks } } } }), JSON.stringify(validate.errors)).toBe(true);
      expect(validate({ name: 'example', infra: { layers: [{ name: 'base', path: 'infra', hooks: { preprovision: hooks } }] } }), JSON.stringify(validate.errors)).toBe(true);
    }
  });

  it('retains native host conditions without misrepresenting legacy permissiveness', () => {
    expect(native({ name: 'example', services: { web: { host: 'containerapp', image: 'example', project: '.' } } })).toBe(false);
    expect(validate({ name: 'example', services: { web: { host: 'containerapp', image: 'example', project: '.' } } })).toBe(false);
    expect(native({ name: 'example', services: { web: { host: 'staticwebapp' } } })).toBe(false);
    expect(native({ name: 'example', services: { web: { host: 'appservice', k8s: {} } } })).toBe(false);
  });

  it('preserves representative accepted legacy fields and service uses', () => {
    const samples = [
      { name: 'example', services: { web: { host: 'containerapp', image: 'example', pull_policy: 'missing', volumes: ['data:/data'], ports: ['8080'], uses: ['db'] } } },
      { name: 'example', hooks: { prerun: [{ run: 'echo ok', shell: 'bash' }] } },
      { name: 'example', services: { web: { host: 'custom', project: '.', dependencies: ['db'], command: 'node app.js' } } },
    ];
    for (const sample of samples) {
      expect(legacy(sample), JSON.stringify(legacy.errors)).toBe(true);
      expect(validate(sample), JSON.stringify(validate.errors)).toBe(true);
    }
  });

  for (const group of ['valid', 'invalid']) {
    const fixtures = join(directory, 'fixtures', 'promote', group);
    for (const file of readdirSync(fixtures)) {
      it(`${group} strict promote fixture ${file}`, () => {
        const document = parse(readFileSync(join(fixtures, file), 'utf8'));
        expect(fragment(document.promote), JSON.stringify(fragment.errors)).toBe(group === 'valid');
        expect(validate(document), JSON.stringify(validate.errors)).toBe(group === 'valid');
      });
    }
  }

  it('fails closed for unregistered references and unknown dialects', async () => {
    const registry = createSchemaValidator(directory);
    await expect(registry.compile({ $schema: 'https://json-schema.org/draft/2019-09/schema', $id: 'https://example.test/missing', $ref: 'https://example.test/not-registered' })).rejects.toThrow('Unregistered');
    await expect(registry.compile({ $schema: 'https://example.test/dialect' })).rejects.toThrow('Unsupported dialect');
  });

  it('uses the declared dialect for reference sibling assertions', async () => {
    const registry = createSchemaValidator(directory);
    for (const [dialect, expected] of [
      ['http://json-schema.org/draft-07/schema#', true],
      ['https://json-schema.org/draft/2019-09/schema', false],
    ]) {
      const compiled = await registry.compile({
        $schema: dialect, $id: `https://example.test/${expected}-${dialect.includes('2019')}`,
        definitions: { value: { type: 'string' } },
        $ref: '#/definitions/value', maxLength: 2,
      });
      expect(compiled('long')).toBe(expected);
    }
  });

  it('checks bounded promote command durations against the actual fragment', () => {
    const document = parse(readFileSync(join(directory, 'fixtures', 'promote', 'valid', 'minimal.yaml'), 'utf8'));
    for (const timeout of ['1s', '3600s', '60m', '1h']) {
      const promote = { ...document.promote, commands: { inspect: { effect: 'inspection', executable: 'echo', timeout } } };
      expect(fragment(promote), JSON.stringify(fragment.errors)).toBe(true);
    }
    for (const timeout of ['0s', '3601s', '61m', '2h', '1m1s', '-1s']) {
      expect(fragment({ ...document.promote, commands: { inspect: { effect: 'inspection', executable: 'echo', timeout } } })).toBe(false);
    }
  });

  it('rebases the complete Foundry graph and does not leave mutable Azure refs', () => {
    const registry = createSchemaValidator(directory);
    for (const { schema } of registry.resources) {
      const text = JSON.stringify(schema);
      expect(text).not.toMatch(/https:\/\/raw\.githubusercontent\.com\/Azure\/azure-dev\/(?:main|refs\/heads\/main)\//);
    }
  });
});
