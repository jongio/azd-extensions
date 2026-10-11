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
  [
    'command-result-non-change-effects',
    [
      error('/promote/commands/prepare-local/effect', 'const'),
      error('/promote/commands/inspect-target/effect', 'const'),
      error('/promote/commands/verify-target/effect', 'const'),
    ],
  ],
  [
    'camel-cased-promote-id',
    [
      error('/promote/environments/dev/provider', 'pattern'),
      error('/promote/providers', 'propertyNames', { propertyName: 'localPublisher' }),
    ],
  ],
  ['empty-task', [error('/promote/tasks/empty/steps', 'minItems')]],
  ['empty-target-artifacts', [error('/promote/environments/dev/artifacts', 'minItems')]],
  ['flat-target-steps', [additionalProperty('/promote/environments/dev', 'steps')]],
  ['implicit-basic-auth', [error('/promote/environments/dev/verificationAuth', 'oneOf')]],
  ['invalid-command-capture', [error('/promote/commands/inspect-target/capture', 'enum')]],
  ['invalid-command-result', [error('/promote/commands/deploy/result', 'const')]],
  ['invalid-live-url-path', [error('/promote/artifacts/site/liveFiles/0/urlPath', 'pattern')]],
  ['invalid-target-mode', [additionalProperty('/promote/environments/dev', 'mode')]],
  [
    'legacy-artifact-identity-paths',
    [additionalProperty('/promote/artifacts/site', 'identityPaths')],
  ],
  [
    'legacy-inspection-only',
    [additionalProperty('/promote/commands/inspect-target', 'inspectionOnly')],
  ],
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
      additionalProperty('/promote/environments/staging', 'snapshot'),
    ],
  ],
  [
    'legacy-operation-target',
    [
      missingProperty('/promote/operations/validate-content', 'environment'),
      additionalProperty('/promote/operations/validate-content', 'target'),
    ],
  ],
  ['legacy-change-lifecycle', [additionalProperty('/promote/environments/dev/workflow', 'change')]],
  [
    'legacy-executable-command',
    [
      missingProperty('/promote/providers/publisher', 'executable'),
      additionalProperty('/promote/providers/publisher', 'command'),
      missingProperty('/promote/commands/build', 'executable'),
      additionalProperty('/promote/commands/build', 'command'),
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
  [
    'legacy-section-terminology',
    [
      additionalProperty('/promote', 'sections'),
      missingProperty('/promote/environments/dev/workflow/prepare/0', 'task'),
      additionalProperty('/promote/environments/dev/workflow/prepare/0', 'section'),
    ],
  ],
  [
    'legacy-step-use',
    [
      missingProperty('/promote/tasks/file-prep/steps/0', 'command'),
      additionalProperty('/promote/tasks/file-prep/steps/0', 'use'),
    ],
  ],
  [
    'legacy-target-policy-names',
    [
      additionalProperty('/promote/environments/dev', 'auth'),
      additionalProperty('/promote/environments/dev', 'snapshot'),
      missingProperty('/promote/environments/dev/requires', 'predecessor'),
      additionalProperty('/promote/environments/dev/requires', 'previous'),
    ],
  ],
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
    [additionalProperty('/promote/providers/azure-publisher', 'executable')],
  ],
  [
    'mixed-process-provider-fields',
    [additionalProperty('/promote/providers/local-publisher', 'config')],
  ],
  ['missing-command-effect', [missingProperty('/promote/commands/inspect-target', 'effect')]],
  ['missing-command-timeout', [missingProperty('/promote/commands/inspect-target', 'timeout')]],
  ['missing-operation-environment', [missingProperty('/promote/operations/validate-content', 'environment')]],
  ['missing-provider-timeout', [missingProperty('/promote/providers/local-publisher', 'timeout')]],
  ['missing-process-executable', [missingProperty('/promote/providers/local-publisher', 'executable')]],
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
  [
    'nested-task',
    [
      missingProperty('/promote/tasks/outer/steps/0', 'command'),
      additionalProperty('/promote/tasks/outer/steps/0', 'task'),
    ],
  ],
  ['negative-provider-timeout', [error('/promote/providers/local-publisher/timeout', 'pattern')]],
  ['non-deploying-provider-override', [error('/promote/operations/validate', 'not')]],
  ['overlong-command-timeout', [error('/promote/commands/inspect-target/timeout', 'pattern')]],
  ['promote-version', [additionalProperty('/promote', 'version')]],
  [
    'raw-auth-secret',
    [
      error('/promote/environments/dev/verificationAuth/username', 'type'),
      error('/promote/environments/dev/verificationAuth/password', 'type'),
    ],
  ],
  ['snapshot-duplicate-ref', [error('/promote/environments/prod/gitSnapshot/refs', 'uniqueItems')]],
  [
    'snapshot-kind-ref-mismatch',
    [error('/promote/environments/prod/gitSnapshot/refs/0/ref', 'pattern')],
  ],
  [
    'snapshot-unknown-template-token',
    [error('/promote/environments/prod/gitSnapshot/refs/0/template', 'pattern')],
  ],
  ['compound-command-timeout', [error('/promote/commands/inspect-target/timeout', 'pattern')]],
  ['string-command-invocation', [error('/promote/tasks/build-output/steps/0', 'type')]],
  ['tokenized-sealed-path', [error('/promote/artifacts/site/sealedPaths/0', 'pattern')]],
  ['unbounded-command-timeout', [error('/promote/commands/inspect-target/timeout', 'pattern')]],
  ['unknown-nested-property', [additionalProperty('/promote/environments/dev', 'unexpected')]],
  ['unsupported-artifact-type', [error('/promote/artifacts/site/type', 'enum')]],
  ['unsupported-provider-type', [error('/promote/providers/custom-publisher', 'oneOf')]],
  [
    'verification-import-path',
    [error('/promote/environments/prod/requires/predecessor/verifications/0', 'pattern')],
  ],
  [
    'verification-effect-without-record',
    [missingProperty('/promote/commands/verify-target', 'verification')],
  ],
  ['verification-without-effect', [missingProperty('/promote/commands/verify-target', 'effect')]],
  ['zero-command-timeout', [error('/promote/commands/inspect-target/timeout', 'pattern')]],
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

  it('requires exactly one Git ref relationship', async () => {
    const validate = await compileSchema()
    const fixture = await loadFixture('valid', 'full-contract')
    const prodRef = fixture.promote.environments.prod.git.ref

    expect(prodRef).toEqual({
      integratedInto: 'origin/main',
      refresh: true,
    })
    expect(validate(fixture), JSON.stringify(validate.errors, null, 2)).toBe(true)

    prodRef.exact = 'origin/main'
    expect(validate(fixture)).toBe(false)
    expect(validate.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          instancePath: '/promote/environments/prod/git/ref',
          keyword: 'not',
        }),
      ])
    )

  })

  it('uses reusable tasks, parameterized commands, and explicit lifecycle groups', async () => {
    const schema = await loadSchema()
    const fixture = await loadFixture('valid', 'full-contract')
    const promoteProperties = schema.definitions.promoteConfig.properties
    const targetProperties = schema.definitions.promoteTarget.properties
    const workflowProperties = schema.definitions.promoteWorkflow.properties

    expect(promoteProperties.commands.$ref).toBe('#/definitions/promoteCommands')
    expect(promoteProperties.tasks.$ref).toBe('#/definitions/promoteTasks')
    expect(promoteProperties).not.toHaveProperty('hooks')
    expect(targetProperties.workflow.$ref).toBe('#/definitions/promoteWorkflow')
    expect(targetProperties).not.toHaveProperty('steps')
    expect(targetProperties).not.toHaveProperty('hooks')
    expect(Object.keys(workflowProperties).sort()).toEqual([
      'apply',
      'cleanup',
      'prepare',
      'verify',
    ])
    expect(schema.definitions.promoteTask.required).toEqual(['steps'])
    expect(schema.definitions.promoteTask.properties.steps.$ref)
      .toBe('#/definitions/promoteCommandInvocations')

    const taskInvocations = [
      ...Object.values(fixture.promote.environments),
      ...Object.values(fixture.promote.operations),
    ].flatMap((target) => Object.values(target.workflow ?? {}).flat())
    const authParameters = taskInvocations
      .filter((invocation) => invocation.task === 'access-preflight')
      .map((invocation) => invocation.with)
    const buildModes = taskInvocations
      .filter((invocation) => invocation.task === 'build-output')
      .map((invocation) => invocation.with['build-mode'])

    expect(authParameters).toContainEqual({ 'auth-required': false })
    expect(authParameters).toContainEqual({ 'auth-required': true })
    expect(new Set(buildModes)).toEqual(new Set(['preview', 'release']))
    expect(fixture.promote.tasks['access-preflight'].steps[0]).toEqual({
      command: 'verify-auth',
      with: { required: '{auth-required}' },
    })
    expect(fixture.promote.commands).not.toHaveProperty('verify-auth-required')
    expect(fixture.promote.commands).not.toHaveProperty('build-preview')
  })

  it('allows an optional change result only on change commands', async () => {
    const schema = await loadSchema()
    const fixture = await loadFixture('valid', 'full-contract')
    const commandDefinition = schema.definitions.promoteCommand

    expect(commandDefinition.required).not.toContain('result')
    expect(commandDefinition.properties.result).toMatchObject({
      type: 'string',
      const: 'change',
    })
    expect(commandDefinition.allOf).toEqual(
      expect.arrayContaining([
        {
          if: {
            required: ['result'],
          },
          then: {
            required: ['effect'],
            properties: {
              effect: {
                const: 'change',
              },
            },
          },
        },
      ])
    )
    expect(fixture.promote.commands['migrate-data']).toEqual({
      effect: 'change',
      result: 'change',
      executable: 'node',
      args: ['scripts/migrate-data.mjs'],
      timeout: '30m',
    })
    expect(fixture.promote.commands['publish-assets']).not.toHaveProperty('result')
  })

  it('defines operation composition through one environment-based rule', async () => {
    const schema = await loadSchema()
    const fixture = await loadFixture('valid', 'named-operation')
    const operationDefinition = schema.definitions.promoteOperation
    const operation = fixture.promote.operations['validate-content']
    const base = fixture.promote.environments.prod

    expect(operationDefinition.required).toEqual(['environment'])
    expect(operationDefinition.properties).not.toHaveProperty('target')
    expect(operationDefinition.properties).not.toHaveProperty('mode')
    expect(operationDefinition.properties.git.$ref).toBe('#/definitions/promoteGitOverride')
    expect(operationDefinition.description).toContain('inherits provider, artifacts, verificationAuth, and git')
    expect(operationDefinition.description).toContain('git merges recursively')
    expect(operationDefinition.description).toContain('are never inherited')
    expect(operationDefinition.description).toContain('deploy to false')

    expect(operation.environment).toBe('prod')
    expect(operation.deploy).toBe(false)
    expect(operation).not.toHaveProperty('provider')
    expect(operation).not.toHaveProperty('artifacts')
    expect(operation).not.toHaveProperty('verificationAuth')
    expect(base.provider).toBe('publisher')
    expect(base.artifacts).toEqual(['site'])
    expect(base.verificationAuth.type).toBe('headers')
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
    expect(base.workflow.prepare[0]).toEqual({
      task: 'build-output',
      with: { mode: 'release' },
    })
    expect(operation.workflow.prepare[0]).toEqual({
      task: 'build-output',
      with: { mode: 'preview' },
    })
    expect(base).toHaveProperty('approval')
    expect(base).toHaveProperty('gitSnapshot')
    expect(operation).not.toHaveProperty('approval')
    expect(operation).not.toHaveProperty('gitSnapshot')
  })

  it('keeps approvals and Git snapshots inline and removes one-use policy identifiers', async () => {
    const schema = await loadSchema()
    const fixture = await loadFixture('valid', 'full-contract')
    const promoteProperties = schema.definitions.promoteConfig.properties
    const targetProperties = schema.definitions.promoteTarget.properties
    const commandProperties = schema.definitions.promoteCommand.properties
    const snapshotDefinition = schema.definitions.promoteGitSnapshot

    expect(promoteProperties).not.toHaveProperty('approvals')
    expect(promoteProperties).not.toHaveProperty('snapshots')
    expect(targetProperties.approval.$ref).toBe('#/definitions/promoteApproval')
    expect(targetProperties.gitSnapshot.$ref).toBe('#/definitions/promoteGitSnapshot')
    expect(commandProperties).not.toHaveProperty('approval')
    expect(snapshotDefinition.required).toEqual(['mode', 'refs'])
    expect(snapshotDefinition.properties).not.toHaveProperty('purpose')
    expect(fixture.promote.environments.staging.gitSnapshot).toEqual({
      remote: 'release-origin',
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
    expect(fixture.promote.operations['validate-content'].git).toEqual({
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
      promoteProcessProvider: ['args', 'executable', 'timeout', 'type', 'workdir'],
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

  it('keeps schema fields lower camelCase and authored IDs lowercase kebab-case', async () => {
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
      'promoteTasks',
      'promoteCommands',
      'promoteCommandParameters',
    ]) {
      expect(schema.definitions[name].propertyNames.pattern)
        .toBe('^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$')
    }

    expect(findings).toEqual([])
  })

  it('documents every promote schema property', async () => {
    const schema = await loadSchema()
    const findings = []

    for (const [name, definition] of Object.entries(schema.definitions)) {
      if (!name.startsWith('promote') || !definition.properties) {
        continue
      }
      for (const [property, value] of Object.entries(definition.properties)) {
        if (!value.$ref && !value.description && !value.title) {
          findings.push(`${name}.${property}`)
        }
      }
    }

    expect(findings).toEqual([])
  })
})
