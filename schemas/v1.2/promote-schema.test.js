import { readdir, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

const directory = dirname(fileURLToPath(import.meta.url))
const schemaPath = join(directory, 'azure.yaml.json')
const fixturesDirectory = join(directory, 'fixtures', 'promote')
const specPath = join(
  directory,
  '..',
  '..',
  'docs',
  'specs',
  'azd-promote-schema-1.2-overhaul',
  'spec.md'
)

const validFixtures = [
  'auth-forms-and-external-names',
  'full-contract',
  'minimal',
  'multiple-chains-one-default',
  'named-operation',
]

const invalidFixtures = [
  ['empty-target-artifacts', 'minItems'],
  ['hyphenated-promote-id', 'pattern'],
  ['invalid-live-url-path', 'pattern'],
  ['invalid-target-mode', 'enum'],
  ['legacy-catalog-concept', 'additionalProperties'],
  ['legacy-phase-fields', 'additionalProperties'],
  ['legacy-underscore-keys', 'additionalProperties'],
  ['missing-cloudflare-config', 'required'],
  ['missing-hook-timeout', 'required'],
  ['missing-process-command', 'required'],
  ['missing-required-structures', 'required'],
  ['missing-target-bindings', 'required'],
  ['overlong-hook-timeout', 'pattern'],
  ['promote-version', 'additionalProperties'],
  ['unknown-nested-property', 'additionalProperties'],
  ['unbounded-hook-timeout', 'pattern'],
  ['unsupported-artifact-type', 'enum'],
  ['unsupported-provider-type', 'enum'],
  ['verification-effect-without-record', 'required'],
  ['verification-without-effect', 'required'],
  ['zero-hook-timeout', 'pattern'],
]

async function loadFixture(kind, name) {
  return parse(await readFile(join(fixturesDirectory, kind, `${name}.yaml`), 'utf8'))
}

async function compileSchema() {
  const schema = await loadSchema()
  const ajv = new Ajv({
    allErrors: true,
    strict: false,
    loadSchema: async () => ({ type: 'object', additionalProperties: true }),
  })
  addFormats(ajv)
  return ajv.compileAsync(schema)
}

async function loadSchema() {
  return JSON.parse(await readFile(schemaPath, 'utf8'))
}

async function loadCanonicalSpecFixture() {
  const spec = await readFile(specPath, 'utf8')
  const heading = spec.indexOf('## Proposed authored schema')
  const promoteStart = spec.indexOf('promote:', heading)
  const fence = String.fromCharCode(96).repeat(3)
  const promoteEnd = spec.indexOf(`\n${fence}`, promoteStart)

  if (heading < 0 || promoteStart < 0 || promoteEnd < 0) {
    throw new Error('Canonical promote YAML block was not found in the design specification.')
  }

  return parse(`name: full-contract\n${spec.slice(promoteStart, promoteEnd).trimEnd()}`)
}

async function fixtureNames(kind) {
  return (await readdir(join(fixturesDirectory, kind)))
    .filter((name) => name.endsWith('.yaml'))
    .map((name) => name.slice(0, -'.yaml'.length))
    .sort()
}

describe('azure.yaml v1.2 promote contract', () => {
  it.each(validFixtures)('accepts valid fixture %s', async (name) => {
    const validate = await compileSchema()
    const fixture = await loadFixture('valid', name)
    expect(validate(fixture), JSON.stringify(validate.errors, null, 2)).toBe(true)
  })

  it.each(invalidFixtures)('rejects invalid fixture %s', async (name, keyword) => {
    const validate = await compileSchema()
    const fixture = await loadFixture('invalid', name)
    expect(validate(fixture)).toBe(false)
    expect(validate.errors?.some((error) => error.keyword === keyword)).toBe(true)
  })

  it('keeps the canonical specification example parseable and fixture-aligned', async () => {
    const validate = await compileSchema()
    const canonical = await loadCanonicalSpecFixture()
    const fixture = await loadFixture('valid', 'full-contract')

    expect(canonical).toEqual(fixture)
    expect(validate(canonical), JSON.stringify(validate.errors, null, 2)).toBe(true)
  })

  it('covers every promote fixture in the dedicated test tables', async () => {
    expect(await fixtureNames('valid')).toEqual([...validFixtures].sort())
    expect(await fixtureNames('invalid')).toEqual(invalidFixtures.map(([name]) => name).sort())
  })

  it('keeps promote-owned objects strict and authored keys lower camelCase', async () => {
    const schema = await loadSchema()
    const findings = []
    const lowerCamelCase = /^[a-z][A-Za-z0-9]*$/

    function inspect(node, path) {
      if (!node || typeof node !== 'object') {
        return
      }

      if (node.type === 'object' && node.properties) {
        if (node.additionalProperties !== false) {
          findings.push(`${path} must set additionalProperties to false`)
        }
        for (const key of Object.keys(node.properties)) {
          if (!lowerCamelCase.test(key)) {
            findings.push(`${path}.properties.${key} must use lower camelCase`)
          }
        }
      }

      for (const [key, value] of Object.entries(node)) {
        if (key !== 'description' && key !== 'title') {
          inspect(value, `${path}.${key}`)
        }
      }
    }

    for (const [name, definition] of Object.entries(schema.definitions)) {
      if (name.startsWith('promote')) {
        inspect(definition, `definitions.${name}`)
      }
    }

    for (const name of [
      'promoteChains',
      'promoteOperations',
      'promoteArtifacts',
      'promoteProviders',
      'promoteHooks',
      'promoteSnapshots',
    ]) {
      expect(schema.definitions[name].propertyNames.pattern).toBe('^[a-z][A-Za-z0-9]*$')
    }

    expect(findings).toEqual([])
  })
})
