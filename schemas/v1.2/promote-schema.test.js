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
  'provider-types',
]

const error = (instancePath, keyword, params = {}) => ({ instancePath, keyword, params })
const additionalProperty = (instancePath, property) =>
  error(instancePath, 'additionalProperties', { additionalProperty: property })
const missingProperty = (instancePath, property) =>
  error(instancePath, 'required', { missingProperty: property })

const invalidFixtures = [
  ['command-approval', [additionalProperty('/promote/commands/deploy', 'approval')]],
  ['empty-target-artifacts', [error('/promote/environments/dev/artifacts', 'minItems')]],
  [
    'hyphenated-promote-id',
    [
      error('/promote/environments/dev/provider', 'pattern'),
      error('/promote/providers', 'propertyNames', { propertyName: 'local-publisher' }),
    ],
  ],
  ['implicit-basic-auth', [error('/promote/environments/dev/auth', 'oneOf')]],
  ['invalid-live-url-path', [error('/promote/artifacts/site/liveFiles/0/urlPath', 'pattern')]],
  ['invalid-target-mode', [additionalProperty('/promote/environments/dev', 'mode')]],
  ['legacy-catalog-concept', [additionalProperty('/promote', 'catalog')]],
  [
    'legacy-candidate',
    [
      additionalProperty('/promote', 'candidate'),
      additionalProperty('/promote/environments/dev', 'candidate'),
    ],
  ],
  ['legacy-global-approvals', [additionalProperty('/promote', 'approvals')]],
  [
    'legacy-named-snapshots',
    [
      additionalProperty('/promote', 'snapshots'),
      error('/promote/environments/staging/snapshot', 'type'),
    ],
  ],
  [
    'legacy-operation-environment',
    [
      missingProperty('/promote/operations/validateContent', 'target'),
      additionalProperty('/promote/operations/validateContent', 'environment'),
    ],
  ],
  [
    'legacy-phase-fields',
    [
      additionalProperty('/promote', 'chain'),
      additionalProperty('/promote', 'protected'),
      additionalProperty('/promote', 'database'),
      additionalProperty('/promote', 'deploy'),
      additionalProperty('/promote', 'purge'),
      additionalProperty('/promote', 'rollback'),
      additionalProperty('/promote', 'notifications'),
    ],
  ],
  ['legacy-previous-run', [additionalProperty('/promote/environments/prod', 'previousRun')]],
  ['legacy-promote-hooks', [additionalProperty('/promote', 'hooks')]],
  ['legacy-promote-project', [additionalProperty('/promote', 'project')]],
  ['legacy-promote-records', [additionalProperty('/promote', 'records')]],
  ['legacy-promote-results', [additionalProperty('/promote', 'results')]],
  ['legacy-target-hooks', [additionalProperty('/promote/environments/dev', 'hooks')]],
  [
    'legacy-underscore-keys',
    [
      additionalProperty('/promote', 'default_chain'),
      additionalProperty('/promote/environments/dev', 'candidate'),
    ],
  ],
  [
    'mixed-azd-provider-fields',
    [additionalProperty('/promote/providers/azurePublisher', 'command')],
  ],
  [
    'mixed-process-provider-fields',
    [additionalProperty('/promote/providers/localPublisher', 'config')],
  ],
  ['missing-hook-timeout', [missingProperty('/promote/commands/inspectTarget', 'timeout')]],
  ['missing-operation-target', [missingProperty('/promote/operations/validateContent', 'target')]],
  ['missing-process-command', [missingProperty('/promote/providers/localPublisher', 'command')]],
  [
    'missing-required-structures',
    [
      missingProperty('/promote', 'environments'),
      missingProperty('/promote', 'artifacts'),
      missingProperty('/promote', 'providers'),
    ],
  ],
  [
    'missing-target-bindings',
    [
      missingProperty('/promote/environments/dev', 'provider'),
      missingProperty('/promote/environments/dev', 'artifacts'),
    ],
  ],
  ['overlong-hook-timeout', [error('/promote/commands/inspectTarget/timeout', 'pattern')]],
  ['promote-version', [additionalProperty('/promote', 'version')]],
  [
    'raw-auth-secret',
    [
      error('/promote/environments/dev/auth/username', 'type'),
      error('/promote/environments/dev/auth/password', 'type'),
    ],
  ],
  ['string-command-invocation', [error('/promote/environments/dev/steps/prepare/0', 'type')]],
  ['unbounded-hook-timeout', [error('/promote/commands/inspectTarget/timeout', 'pattern')]],
  ['unknown-nested-property', [additionalProperty('/promote/environments/dev', 'unexpected')]],
  ['unsupported-artifact-type', [error('/promote/artifacts/site/type', 'enum')]],
  ['unsupported-provider-type', [error('/promote/providers/customPublisher', 'oneOf')]],
  [
    'verification-import-path',
    [error('/promote/environments/prod/requires/previous/verifications/0', 'pattern')],
  ],
  [
    'verification-effect-without-record',
    [missingProperty('/promote/commands/verifyTarget', 'verification')],
  ],
  ['verification-without-effect', [missingProperty('/promote/commands/verifyTarget', 'effect')]],
  ['zero-hook-timeout', [error('/promote/commands/inspectTarget/timeout', 'pattern')]],
]

async function loadFixture(kind, name) {
  return parse(await readFile(join(fixturesDirectory, kind, `${name}.yaml`), 'utf8'))
}

let compiledSchemaPromise

async function compileSchema() {
  compiledSchemaPromise ??= (async () => {
    const schema = await loadSchema()
    const ajv = new Ajv({
      allErrors: true,
      strict: false,
      loadSchema: async () => ({ type: 'object', additionalProperties: true }),
    })
    addFormats(ajv)
    return ajv.compileAsync(schema)
  })()
  return compiledSchemaPromise
}

async function loadSchema() {
  return JSON.parse(await readFile(schemaPath, 'utf8'))
}

async function loadCanonicalSpecFixture() {
  const spec = await readFile(specPath, 'utf8')
  const heading = spec.indexOf('## Proposed authored schema')
  const exampleStart = spec.indexOf('name: full-contract', heading)
  const fence = String.fromCharCode(96).repeat(3)
  const exampleEnd = spec.indexOf(`\n${fence}`, exampleStart)

  if (heading < 0 || exampleStart < 0 || exampleEnd < 0) {
    throw new Error('Canonical azure.yaml block was not found in the design specification.')
  }

  return parse(spec.slice(exampleStart, exampleEnd).trimEnd())
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

  it.each(invalidFixtures)('rejects invalid fixture %s', async (name, expectedErrors) => {
    const validate = await compileSchema()
    const fixture = await loadFixture('invalid', name)
    expect(validate(fixture)).toBe(false)

    for (const expectedError of expectedErrors) {
      expect(validate.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            instancePath: expectedError.instancePath,
            keyword: expectedError.keyword,
            params: expect.objectContaining(expectedError.params),
          }),
        ])
      )
    }
  })

  it('keeps the canonical specification example parseable and fixture-aligned', async () => {
    const validate = await compileSchema()
    const canonical = await loadCanonicalSpecFixture()
    const fixture = await loadFixture('valid', 'full-contract')

    expect(canonical).toEqual(fixture)
    expect(validate(canonical), JSON.stringify(validate.errors, null, 2)).toBe(true)
  })

  it('derives promotion identity from name and keeps framework state out of authoring', async () => {
    const schema = await loadSchema()
    const promoteProperties = schema.definitions.promoteConfig.properties

    expect(schema.properties.name.description).toContain('stable promotion identity')
    expect(promoteProperties.git.$ref).toBe('#/definitions/promoteGit')
    expect(promoteProperties).not.toHaveProperty('project')
    expect(promoteProperties).not.toHaveProperty('records')
    expect(promoteProperties).not.toHaveProperty('results')
    expect(promoteProperties).not.toHaveProperty('candidate')
    expect(schema.definitions).not.toHaveProperty('promoteProject')
    expect(schema.definitions).not.toHaveProperty('promoteRecords')
    expect(schema.definitions).not.toHaveProperty('promoteResults')
    expect(schema.definitions).not.toHaveProperty('promoteCandidate')
    expect(schema.definitions).not.toHaveProperty('promotePreviousRun')

    for (const [definitionName, gitDefinition] of [
      ['promoteTarget', 'promoteGitOverride'],
      ['promoteOperation', 'promoteGitOverride'],
    ]) {
      const properties = schema.definitions[definitionName].properties

      expect(properties.git.$ref).toBe(`#/definitions/${gitDefinition}`)
      expect(properties.requires.$ref).toBe('#/definitions/promoteRequirements')
      expect(properties).not.toHaveProperty('candidate')
      expect(properties).not.toHaveProperty('previousRun')
    }
  })

  it('uses reusable parameterized commands and explicit lifecycle groups', async () => {
    const schema = await loadSchema()
    const fixture = await loadFixture('valid', 'full-contract')
    const promoteProperties = schema.definitions.promoteConfig.properties
    const targetProperties = schema.definitions.promoteTarget.properties
    const lifecycleProperties = schema.definitions.promoteLifecycleSteps.properties

    expect(promoteProperties.commands.$ref).toBe('#/definitions/promoteCommands')
    expect(promoteProperties).not.toHaveProperty('hooks')
    expect(targetProperties.steps.$ref).toBe('#/definitions/promoteLifecycleSteps')
    expect(targetProperties).not.toHaveProperty('hooks')
    expect(Object.keys(lifecycleProperties).sort()).toEqual([
      'change',
      'cleanup',
      'prepare',
      'verify',
    ])

    const invocations = [
      ...Object.values(fixture.promote.environments),
      ...Object.values(fixture.promote.operations),
    ].flatMap((target) => Object.values(target.steps ?? {}).flat())
    const verifyAuthParameters = invocations
      .filter((invocation) => invocation.use === 'verifyAuth')
      .map((invocation) => invocation.with)
    const buildModes = invocations
      .filter((invocation) => invocation.use === 'build')
      .map((invocation) => invocation.with.mode)

    expect(verifyAuthParameters).toContainEqual({ required: false })
    expect(verifyAuthParameters).toContainEqual({ required: true })
    expect(new Set(buildModes)).toEqual(new Set(['preview', 'release']))
    expect(fixture.promote.commands).not.toHaveProperty('verifyAuthRequired')
    expect(fixture.promote.commands).not.toHaveProperty('buildPreview')
  })

  it('defines operation composition through one target-based rule', async () => {
    const schema = await loadSchema()
    const fixture = await loadFixture('valid', 'named-operation')
    const operationDefinition = schema.definitions.promoteOperation
    const operation = fixture.promote.operations.validateContent
    const base = fixture.promote.environments.prod

    expect(operationDefinition.required).toEqual(['target'])
    expect(operationDefinition.properties).not.toHaveProperty('environment')
    expect(operationDefinition.properties).not.toHaveProperty('mode')
    expect(operationDefinition.properties.git.$ref).toBe('#/definitions/promoteGitOverride')
    expect(operationDefinition.description).toContain('inherits provider, artifacts, auth, and git')
    expect(operationDefinition.description).toContain('git merges recursively')
    expect(operationDefinition.description).toContain('are never inherited')

    expect(operation.target).toBe('prod')
    expect(operation.provider).toBe('validator')
    expect(operation).not.toHaveProperty('artifacts')
    expect(operation).not.toHaveProperty('auth')
    expect(base.provider).toBe('publisher')
    expect(base.artifacts).toEqual(['site'])
    expect(base.auth.type).toBe('headers')
    expect(fixture.promote.git).toEqual({
      worktree: 'clean',
      upstream: 'published',
      ref: { exact: 'origin/main', refresh: false },
    })
    expect(base.git.ref).toEqual({ refresh: true })
    expect(operation.git).toEqual({
      worktree: 'dirtyAllowed',
      ref: { refresh: false },
    })
    expect(base.steps.prepare[0].with).toEqual({ mode: 'release' })
    expect(operation.steps.prepare[0].with).toEqual({ mode: 'preview' })
    expect(base).toHaveProperty('approval')
    expect(base).toHaveProperty('snapshot')
    expect(operation).not.toHaveProperty('approval')
    expect(operation).not.toHaveProperty('snapshot')
  })

  it('keeps approvals and snapshots inline and removes one-use policy identifiers', async () => {
    const schema = await loadSchema()
    const fixture = await loadFixture('valid', 'full-contract')
    const promoteProperties = schema.definitions.promoteConfig.properties
    const targetProperties = schema.definitions.promoteTarget.properties
    const commandProperties = schema.definitions.promoteCommand.properties
    const snapshotDefinition = schema.definitions.promoteSnapshot

    expect(promoteProperties).not.toHaveProperty('approvals')
    expect(promoteProperties).not.toHaveProperty('snapshots')
    expect(targetProperties.approval.$ref).toBe('#/definitions/promoteApproval')
    expect(targetProperties.snapshot.$ref).toBe('#/definitions/promoteSnapshot')
    expect(commandProperties).not.toHaveProperty('approval')
    expect(snapshotDefinition.required).toEqual(['mode', 'refs'])
    expect(snapshotDefinition.properties).not.toHaveProperty('purpose')
    expect(fixture.promote.environments.staging.snapshot).toEqual({
      mode: 'publish',
      recovery: 'manual',
      refs: [{ kind: 'branch', ref: 'refs/heads/environments/staging' }],
    })
    expect(fixture.promote).not.toHaveProperty('approvals')
    expect(fixture.promote).not.toHaveProperty('snapshots')
    expect(JSON.stringify(fixture)).not.toContain('stagingRelease')
    expect(JSON.stringify(fixture)).not.toContain('productionRelease')
  })

  it('defines ordered Git policy composition from promote to environment to operation', async () => {
    const schema = await loadSchema()
    const fixture = await loadFixture('valid', 'named-operation')
    const gitDescription = schema.definitions.promoteGit.description

    expect(gitDescription).toContain('promote-level policy is the base')
    expect(gitDescription).toContain('Environment-authored members recursively merge')
    expect(schema.definitions.promoteOperation.description).toContain(
      'Authored git merges recursively'
    )
    expect(fixture.promote.git).toEqual({
      worktree: 'clean',
      upstream: 'published',
      ref: { exact: 'origin/main', refresh: false },
    })
    expect(fixture.promote.environments.prod.git).toEqual({
      ref: { refresh: true },
    })
    expect(fixture.promote.operations.validateContent.git).toEqual({
      worktree: 'dirtyAllowed',
      ref: { refresh: false },
    })
  })

  it('uses strict type-specific provider schemas', async () => {
    const schema = await loadSchema()
    const providerRefs = schema.definitions.promoteProvider.oneOf.map((entry) => entry.$ref)

    expect(providerRefs).toEqual([
      '#/definitions/promoteProcessProvider',
      '#/definitions/promoteAzdProvider',
    ])

    const expectedProperties = {
      promoteProcessProvider: ['args', 'command', 'timeout', 'type', 'workdir'],
      promoteAzdProvider: ['args', 'timeout', 'type', 'workdir'],
    }

    for (const [name, properties] of Object.entries(expectedProperties)) {
      const definition = schema.definitions[name]

      expect(definition.additionalProperties).toBe(false)
      expect(Object.keys(definition.properties).sort()).toEqual(properties)
    }
  })

  it('preserves representative v1.0 and v1.1 configuration behavior', async () => {
    const validate = await compileSchema()
    const compatibleConfiguration = {
      name: 'compatible-app',
      resourceGroup: 'rg-compatible-app',
      metadata: {
        template: 'compatible-app@1.0.0',
      },
      infra: {
        provider: 'bicep',
        path: 'infra',
        module: 'main',
      },
      reqs: [
        {
          name: 'node',
          minVersion: '20.0.0',
        },
      ],
      logs: {
        filters: {
          exclude: ['npm warn'],
        },
      },
      test: {
        parallel: true,
        failFast: false,
        outputDir: './test-results',
        outputFormat: 'junit',
      },
    }

    expect(validate(compatibleConfiguration), JSON.stringify(validate.errors, null, 2)).toBe(true)
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
      'promoteCommands',
      'promoteCommandParameters',
    ]) {
      expect(schema.definitions[name].propertyNames.pattern).toBe('^[a-z][A-Za-z0-9]*$')
    }

    expect(findings).toEqual([])
  })
})
