# azd-promote schema 1.2 naming overhaul design specification

## Objective

Replace the stale `promote` model in the azd-extensions v1.2 `azure.yaml`
schema with the complete config-first promote contract, using one plain-language
naming model across authored YAML, internal Go types, CLI commands, JSON DTOs,
MCP tools, durable state, documentation, examples, and downstream consumers.

The schema change is contract-first. It defines and validates the final public
shape. Runtime implementations and downstream consumers must implement this
exact contract without aliases because the current promote schema is
unreleased.

The top-level `name` is the promotion identity. Authored promotion policy does
not repeat project identity or select framework state paths. Git policy is
authored under `git`, and predecessor verification imports use stable IDs under
`requires.previous.verifications`.

Reusable process definitions are authored under `commands`. Environments and
operations invoke them through `steps.prepare`, `steps.change`,
`steps.verify`, and `steps.cleanup` objects containing `use` and optional
`with` parameters. Operations compose from one real environment through
`target` using the complete rule documented below.

## User decisions

1. `default_chain` is rejected. The default belongs inside the chain.
2. A single chain is selected automatically. Multiple chains require exactly
   one `default: true`.
3. `require_clean` and other `require_*` booleans are rejected. Policies use
   nested state values.
4. Every underscore and hyphen is audited in the authored `promote` schema.
   Framework-owned keys and identifiers use lower camelCase.
5. File names, paths, CLI flags, environment variables, external resource
   names, and real azd environment names may retain idiomatic hyphens.
6. `catalog` is not a framework concept. Operation IDs use verb-first,
   application-neutral names such as `publishContent`, `validateContent`, and
   `activateContent`.
7. `evidence`, `receipt`, and `proof` are removed from the normal public mental
   model. Public terms are run record, verification, result, checks, and
   inspection.
8. Internal Go types and functions must use the same concepts as the public
   schema. Developers must not mentally translate between two vocabularies.
9. Environment-suffixed duplicate commands are consolidated when only target
   values differ. Commands are target-environment-driven by default and use
   invocation parameters for the varying values.
10. The promote contract is unreleased. Old spellings are rejected; there are no aliases,
    deprecation windows, redirects, or compatibility parsing.
11. The authored `promote` object has no independent `version`. The
    `azure.yaml` `$schema` URI for v1.2 is the sole public contract version.
12. Top-level `name` is the stable promotion identity. `promote.project` is not
    authored.
13. Run-record and operation-result paths are framework state. Authors do not
    configure `promote.records` or `promote.results`.
14. Repository policy is authored under `git`, not `candidate`.
15. Predecessor verification imports use stable IDs under
    `requires.previous.verifications`, not authored filesystem paths.
16. Authentication values use explicit azd secret references. Scalar
    `auth: basic` defaults are rejected.
17. Reusable authored definitions use `commands`, not `hooks`.
18. Lifecycle groups are `prepare`, `change`, `verify`, and `cleanup`.
19. Every lifecycle entry is an invocation object with `use` and optional
    scalar `with` parameters. Bare command-name strings are rejected.
20. Operations bind to a base environment through `target`. They inherit
    provider, artifacts, auth, and Git policy only, with recursive Git merging.
    Requirements, steps, locks, snapshots, and approvals remain
    operation-owned.
21. Approval policy is inline on the environment or operation that owns the
    boundary. A global approval target list is rejected.
22. Snapshot policy is inline on its environment or operation. Named one-use
    snapshot IDs and repeated purpose IDs are rejected.
23. Target `mode` is removed. Validation uses ordinary command invocations or
    a generic provider selected by the operation.
24. Provider schemas are strict per type. Process, azd, and Cloudflare Worker
    fields cannot be mixed.

## Scope

### This repository

- Replace `schemas/v1.2/azure.yaml.json` promote schema.
- Add strict promote definitions with camelCase keys and promote-owned ID
  patterns.
- Add valid and invalid schema fixtures and executable AJV tests.
- Update `schemas/v1.2/CHANGELOG.md`.
- Add this design under
  `docs/specs/azd-promote-schema-1.2-overhaul/spec.md`.
- Keep all v1.0 and v1.1 schema content unchanged.

### Downstream runtime implementations

- Rename authored config types, internal types, functions, actions, DTOs, MCP
  tools, commands, renderers, and durable paths to match the contract.
- Rename `evidence` command to `inspect`.
- Rename receipt/runstate concepts to run records.
- Rename evidence concepts to verification records.
- Rename proof concepts to operation results.
- Rename finalizers to cleanup steps and mutation boundaries to changed
  resources or change boundaries.
- Implement reusable parameterized commands and explicit lifecycle expansion.
- Implement the documented target-based operation composition rule.
- Implement progress counts, elapsed time, and historical estimates.

### Downstream consumer configurations

- Migrate authored `azure.yaml` files to the final schema 1.2 promote contract.
- Consolidate duplicate build, asset, verification, and smoke-test commands
  where behavior is equivalent.
- Rename promote-owned IDs to lower camelCase.
- Keep idiomatic dashed file names such as `staging-content.json`.
- Validate every environment and operation through an offline plan before any
  deployment.

## Exclusions

- No hosted deployment.
- No staging or production mutation.
- No credential changes.
- No azd-promote runtime implementation.
- No provider protocol implementation.
- No BBQDB changes.
- No backward-compatible aliases for old experimental promote names.
- No authored `promote.version` field.
- No rename of core azd v1.0/v1.1 keys.
- No ban on hyphens in file paths, CLI flags, environment variables, Azure
  resource names, Git refs, or externally owned identifiers.

## Convention Discovery

- azd core and azd-app schema keys use lower camelCase for modern authored
  fields such as `resourceGroup`, `requiredVersions`, `readyPattern`,
  `healthCheck`, and `urlPath`.
- CLI flags remain kebab-case by Cobra convention.
- JSON API fields already use lower camelCase.
- Go exported types use PascalCase and fields use Go identifier conventions.
- Files and directories use idiomatic kebab-case.
- The current azd-extensions v1.2 promote section is a stale pre-config-first contract
  with snake_case fields and permissive nested objects. It is not a convention
  to preserve.
- A conforming promotion runtime uses strict decoding, generated plans, and
  explicit runtime cross-reference validation. The replacement schema should
  mirror those boundaries.

## Impact Scan

| Surface                        | Impact                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------- |
| `azd-extensions` v1.2 schema   | Complete replacement of the optional `promote` section and new definitions                    |
| Promotion runtime and compiler | Downstream breaking migration to the exact unversioned promote contract                       |
| Runtime internal model         | Downstream rename of run record, verification, result, cleanup, change, and run context types |
| CLI and MCP adapters           | Downstream `inspect` command/tool and plain-language output                                   |
| Durable local state            | Downstream directory and schema migration before public release                               |
| Examples and website           | Follow-up replacement with one canonical schema example                                       |
| Downstream consumers           | Authored-config migration and reusable-command consolidation                                  |
| Existing azd v1.0/v1.1 schema  | No change                                                                                     |
| Hosted environments            | No change in this schema definition                                                           |

## Acceptance Criteria

1. `schemas/v1.2/azure.yaml.json` defines the complete strict promote model shown in
   this plan.
2. The legacy promote fields `chain`, `protected`, `database`, `deploy`,
   `purge`, `rollback`, `notifications`, legacy phase hooks, and deep-merge
   environment overrides are removed.
3. Promote-owned YAML keys use lower camelCase.
4. Promote-owned IDs reject `_` and `-`; real azd environment names, paths,
   external resources, locks, refs, CLI flags, and environment variables remain
   valid with their native conventions.
5. Chains use nested `{default, targets}` objects. One chain auto-selects;
   multiple chains require one runtime-selected default.
6. Git policy uses `worktree`, `upstream`, and `ref` states, with no requirement
   booleans.
7. Top-level `name` is documented as promotion identity.
8. `project`, `records`, `results`, `candidate`, and `previousRun` are rejected
   under `promote`.
9. Predecessor verification imports use stable lower camel case IDs, not
   filesystem paths.
10. Authentication values use explicit azd secret references.
11. The schema uses run record, previous run, verification, operation result,
    cleanup, change, and inspection terminology.
12. Valid minimal and full promote fixtures pass.
13. Fixtures containing old underscore keys, promote-owned hyphenated IDs, or
    unknown fields fail.
14. Dashed file names and real external names remain valid.
15. Existing v1.0 and v1.1 schema behavior remains unchanged.
16. `pnpm test`, `pnpm validate-schema --offline`, `pnpm check`, and
    `pnpm build` pass.
17. The changelog and design explain the breaking pre-release replacement and
    downstream adoption expectations.
18. Reusable definitions are authored under `commands`; top-level and target
    `hooks` are rejected.
19. Lifecycle groups use `prepare`, `change`, `verify`, and `cleanup`.
20. Command invocations use `{use, with}` objects, and one definition is reused
    with different parameter values in the canonical fixture.
21. Operation composition is defined by `target` and the documented base
    environment rule. The former operation `environment` field is rejected.
22. Approvals and snapshots are inline on environments and operations. Global
    approval lists, named snapshot maps, and snapshot purpose IDs are rejected.
23. Target `mode` is rejected. Generic process-provider behavior represents
    validation without a provider-specific mode.
24. Provider variants are strict and type-specific. Mixed-provider fields fail
    JSON Schema validation.
25. Encoded duplicate IDs such as `stagingRelease`,
    `verifyAuthRequired`, and `buildPreview` are unnecessary in the canonical
    contract.

## Pre-Completion Interview

All material choices are resolved by the user:

- **Default chain:** nested `default: true`; automatic when only one chain.
- **Separator policy:** audit `_` and `-` only for public promote schema keys
  and promote-owned identifiers.
- **File naming:** idiomatic dashed file names remain valid.
- **Domain naming:** `catalog` is not a generic framework concept.
- **Terminology:** replace evidence, receipt, and proof publicly and internally.
- **Internal consistency:** Go types and functions mirror public schema
  concepts.
- **Command duplication:** consolidate environment suffixes when behavior is
  invocation-parameter-driven.
- **Operation composition:** `target` selects the base environment; only
  provider, artifacts, auth, and Git policy inherit.
- **Inline policy:** approvals and snapshots live on the environment or
  operation that owns them.
- **Provider behavior:** validation uses a generic provider or command rather
  than target `mode`.
- **Compatibility:** no aliases because the promote contract is unreleased.
- **Versioning:** `$schema` v1.2 is the only authored version; durable records
  and API/event formats retain independent internal versions.

No further interview decision blocks the schema definition.

## Gut-Check Results

- **Greenfield reframe:** The recommended schema is the design we would choose
  from scratch: strict, nested, lower camelCase, convention-driven, and free of
  stale phase-specific orchestration.
- **Proportionality:** The schema describes capabilities the runtime already
  owns or has explicitly scheduled. It does not add plugin systems, factories,
  or speculative policy layers.
- **Sunk-cost sniff:** Existing experimental names and the stale v1.2 promote schema carry
  no compatibility weight because the contract is unreleased. They are not
  retained merely because code already exists.

## Naming conventions

| Surface                    | Convention                               |
| -------------------------- | ---------------------------------------- |
| Promote YAML keys          | lower camelCase                          |
| Promote-owned IDs          | lower camelCase                          |
| Real azd environment names | existing azd convention; hyphens allowed |
| Lock/resource selectors    | external syntax preserved                |
| Go exported types          | public schema concepts in PascalCase     |
| Go fields and functions    | public schema concepts in Go style       |
| JSON API fields            | lower camelCase                          |
| CLI commands               | simple verbs such as `inspect`           |
| CLI flags                  | kebab-case                               |
| File and directory names   | idiomatic kebab-case                     |
| Environment variables      | uppercase snake case                     |

## Proposed authored schema

The example uses neutral sample identifiers, generic resources and verification
files, and the reserved `example.invalid` domain.

```yaml
name: full-contract
promote:
  chains:
    release:
      default: true
      targets: [dev, staging, prod]

  git:
    worktree: clean
    upstream: published

  artifacts:
    contentApp:
      type: static
      path: dist/content-app
      identityPaths:
        - azure.yaml
        - pnpm-lock.yaml
      sealedPaths:
        - '.azure/promote/verification/{workflow}-selected-files.json'
      liveFiles:
        - path: content-index.json

  providers:
    contentPublisher:
      type: process
      command: node
      args:
        [
          scripts/publish-content-app.mjs,
          --artifact,
          '{artifact}',
          --environment,
          '{environment}',
          --result,
          '{result}',
        ]
      workdir: .
      timeout: 30m
    contentValidator:
      type: process
      command: node
      args:
        [
          scripts/validate-content-app.mjs,
          --artifact,
          '{artifact}',
          --environment,
          '{environment}',
          --result,
          '{result}',
        ]
      workdir: .
      timeout: 30m
    azureFallback:
      type: azd
      args: [--all]
      workdir: infra
      timeout: 30m

  environments:
    dev:
      provider: contentPublisher
      artifacts: [contentApp]
      git:
        worktree: dirtyAllowed
      auth:
        type: basic
        username: { azd: DEV_BASIC_AUTH_USERNAME }
        password: { azd: DEV_BASIC_AUTH_PASSWORD }
      steps:
        prepare:
          - use: verifyAuth
            with: { required: false }
          - use: checkAssetStore
          - use: build
            with: { mode: release }
          - use: pruneOutput
          - use: normalizeOutput
        change:
          - use: migrateData
          - use: publishAssets
          - use: configureAssetCors
        verify:
          - use: verifyData
          - use: verifyOfflineOutput
          - use: selectFiles
          - use: runSmokeTests
            with: { suite: fast }
          - use: verifyLiveSite
        cleanup:
          - use: removeUnusedFiles

    staging:
      provider: contentPublisher
      artifacts: [contentApp]
      auth:
        type: basic
        username: { azd: STAGING_BASIC_AUTH_USERNAME }
        password: { azd: STAGING_BASIC_AUTH_PASSWORD }
      approval:
        message: Approve the exact staging candidate
        match: PROMOTE
        automation: allowed
      snapshot:
        mode: publish
        recovery: manual
        refs:
          - kind: branch
            ref: refs/heads/environments/staging
      steps:
        prepare:
          - use: verifyAuth
            with: { required: true }
          - use: checkAssetStore
          - use: build
            with: { mode: release }
          - use: pruneOutput
          - use: normalizeOutput
        change:
          - use: migrateData
          - use: publishAssets
          - use: configureAssetCors
        verify:
          - use: verifyData
          - use: verifyOfflineOutput
          - use: selectFiles
          - use: runSmokeTests
            with: { suite: full }
          - use: verifyLiveSite
        cleanup:
          - use: removeUnusedFiles

    prod:
      provider: contentPublisher
      artifacts: [contentApp]
      git:
        worktree: clean
        ref:
          exact: origin/main
          refresh: true
      requires:
        previous:
          verifications: [stagingContent, stagingRouting]
      approval:
        message: Approve the exact production candidate
        match: PROMOTE
        automation: allowed
      snapshot:
        mode: publish
        recovery: manual
        refs:
          - kind: tag
            template: refs/tags/releases/{candidate}
      steps:
        prepare:
          - use: verifyPublisherApproval
          - use: verifyAuth
            with: { required: true }
          - use: checkAssetStore
          - use: build
            with: { mode: release }
          - use: pruneOutput
          - use: normalizeOutput
        change:
          - use: prepareProductionData
          - use: prepareProductionRelease
        verify:
          - use: verifyData
          - use: verifyOfflineOutput
          - use: selectFiles
          - use: verifyDeploymentInputs
          - use: runSmokeTests
            with: { suite: full }
          - use: verifyLiveSite
          - use: verifyPublishedContent
        cleanup:
          - use: removeUnusedFiles

  operations:
    publishContent:
      target: prod
      locks: [content:production, deployment:production]
      approval:
        message: Approve publishing the reviewed content
        match: PUBLISH
        automation: denied
      snapshot:
        mode: publish
        recovery: manual
        refs:
          - kind: tag
            template: refs/tags/content/{candidate}
      steps:
        prepare:
          - use: verifyPreparedContent
          - use: verifyAuth
            with: { required: true }
          - use: checkAssetStore
          - use: build
            with: { mode: release }
          - use: pruneOutput
          - use: normalizeOutput
        verify:
          - use: verifyData
          - use: verifyOfflineOutput
          - use: selectFiles
          - use: verifyContentInputs
          - use: runSmokeTests
            with: { suite: full }
          - use: verifyLiveSite
          - use: verifyPublishedContent
        cleanup:
          - use: removeUnusedFiles

    validateContent:
      target: prod
      provider: contentValidator
      locks: [content:production-candidate]
      steps:
        prepare:
          - use: verifyAuth
            with: { required: true }
          - use: checkAssetStore
          - use: build
            with: { mode: preview }
          - use: pruneOutput
          - use: normalizeOutput
        verify:
          - use: verifyData
          - use: verifyOfflineOutput
          - use: selectFiles
        cleanup:
          - use: removeUnusedFiles

    activateContent:
      target: prod
      locks: [content:production, deployment:production]
      approval:
        message: Approve activation of the exact candidate
        match: ACTIVATE
        automation: denied
      snapshot:
        mode: verify
        recovery: manual
        refs:
          - kind: branch
            ref: refs/heads/environments/production
      steps:
        prepare:
          - use: verifyAuth
            with: { required: true }
          - use: checkAssetStore
          - use: build
            with: { mode: release }
          - use: pruneOutput
          - use: normalizeOutput
        verify:
          - use: verifyData
          - use: verifyOfflineOutput
          - use: selectFiles
          - use: verifyContentInputs
          - use: runSmokeTests
            with: { suite: full }
          - use: verifyLiveSite
          - use: verifyPublishedContent
        cleanup:
          - use: removeUnusedFiles

  commands:
    verifyAuth:
      effect: inspection
      command: node
      args: [scripts/verify-credentials.mjs, --required, '{required}']
      inspectionOnly: true
      timeout: 5m

    checkAssetStore:
      command: node
      args: [scripts/check-resource.mjs, content-assets]
      timeout: 5m

    migrateData:
      effect: change
      command: node
      args: [scripts/migrate-data.mjs]
      timeout: 30m

    verifyData:
      effect: verification
      command: node
      args: [scripts/verify-data.mjs, --record, '.azure/promote/verification/{workflow}-data.json']
      verification:
        path: '.azure/promote/verification/{workflow}-data.json'
      timeout: 10m

    build:
      command: node
      args: [scripts/build-content-app.mjs, --mode, '{mode}']
      timeout: 30m

    pruneOutput:
      command: node
      args: [scripts/prune-output.mjs, dist/content-app]
      timeout: 10m

    normalizeOutput:
      command: node
      args: [scripts/normalize-output.mjs, dist/content-app]
      timeout: 10m

    verifyOfflineOutput:
      effect: verification
      command: node
      args:
        [
          scripts/verify-offline-output.mjs,
          --record,
          '.azure/promote/verification/{workflow}-offline-output.json',
        ]
      verification:
        path: '.azure/promote/verification/{workflow}-offline-output.json'
      timeout: 10m

    publishAssets:
      effect: change
      command: node
      args:
        [
          scripts/publish-assets.mjs,
          --source,
          public/assets,
          --target,
          https://assets.example.invalid,
          --export-dir,
          dist/content-app,
          --skip-existing,
        ]
      timeout: 1h

    selectFiles:
      effect: verification
      command: node
      args:
        [
          scripts/select-files.mjs,
          --source,
          public/assets,
          --target,
          https://assets.example.invalid,
          --dry-run,
          --export-dir,
          dist/content-app,
          --selection-record,
          '.azure/promote/verification/{workflow}-selected-files.json',
        ]
      verification:
        path: '.azure/promote/verification/{workflow}-selected-files.json'
      timeout: 1h

    removeUnusedFiles:
      command: node
      args: [scripts/remove-unused-files.mjs, dist/content-app]
      timeout: 10m

    configureAssetCors:
      effect: change
      command: node
      args: [scripts/configure-asset-cors.mjs, content-assets]
      timeout: 10m

    runSmokeTests:
      effect: verification
      command: node
      args:
        [
          scripts/run-smoke-tests.mjs,
          --suite,
          '{suite}',
          --record,
          '.azure/promote/verification/{workflow}-smoke.json',
        ]
      verification:
        path: '.azure/promote/verification/{workflow}-smoke.json'
      timeout: 15m

    verifyLiveSite:
      effect: verification
      command: node
      args:
        [
          scripts/verify-live-site.mjs,
          --record,
          '.azure/promote/verification/{workflow}-live-site.json',
        ]
      verification:
        path: '.azure/promote/verification/{workflow}-live-site.json'
      timeout: 15m

    prepareProductionData:
      effect: change
      command: node
      args: [scripts/prepare-production-data.mjs]
      timeout: 30m

    verifyPublisherApproval:
      effect: verification
      command: node
      args:
        [
          scripts/verify-publisher-approval.mjs,
          --record,
          '.azure/promote/verification/{workflow}-publisher-approval.json',
        ]
      verification:
        path: '.azure/promote/verification/{workflow}-publisher-approval.json'
      timeout: 5m

    prepareProductionRelease:
      effect: change
      command: node
      args: [scripts/prepare-production-release.mjs]
      timeout: 30m

    verifyDeploymentInputs:
      effect: verification
      command: node
      args:
        [
          scripts/verify-deployment-inputs.mjs,
          --record,
          '.azure/promote/verification/{workflow}-deployment-inputs.json',
        ]
      verification:
        path: '.azure/promote/verification/{workflow}-deployment-inputs.json'
      timeout: 10m

    verifyPublishedContent:
      effect: verification
      command: node
      args:
        [
          scripts/verify-published-content.mjs,
          --record,
          '.azure/promote/verification/{workflow}-published-content.json',
        ]
      verification:
        path: '.azure/promote/verification/{workflow}-published-content.json'
      timeout: 10m

    verifyPreparedContent:
      effect: verification
      command: node
      args:
        [
          scripts/verify-prepared-content.mjs,
          --record,
          '.azure/promote/verification/{workflow}-prepared-content.json',
        ]
      verification:
        path: '.azure/promote/verification/{workflow}-prepared-content.json'
      timeout: 10m

    verifyContentInputs:
      effect: verification
      command: node
      args:
        [
          scripts/verify-content-inputs.mjs,
          --record,
          '.azure/promote/verification/{workflow}-content-inputs.json',
        ]
      verification:
        path: '.azure/promote/verification/{workflow}-content-inputs.json'
      timeout: 10m
```

## Chain rules

1. A chain contains `targets` and optional `default`.
2. With one chain, it is selected automatically.
3. With multiple chains, exactly one must set `default: true`.
4. Zero defaults or multiple defaults are runtime validation errors with
   available chain names.
5. Every chain transition requires a successful current run record from the
   previous target. This is intrinsic and not configured with
   `requireReceipt`.
6. Named operations are not chain targets unless explicitly listed.

## Git rules

```yaml
git:
  worktree: clean # clean | dirtyAllowed
  upstream: published # published | optional
  ref:
    exact: origin/main
    refresh: true
```

- `worktree: clean` replaces `require_clean: true`.
- `worktree: dirtyAllowed` replaces `allow_dirty: true`.
- `upstream: published` means `HEAD` equals its configured upstream.
- `ref.exact` requires the exact ref commit.
- `ref.refresh` fetches the named remote before comparison.
- Invalid combinations are structurally impossible or explicitly rejected.

Git policy composes in one ordered sequence:

1. Top-level `promote.git` is the base policy for every environment.
2. Environment `git` recursively merges into that base, including `ref`
   members. Authored members replace the same member; omitted members inherit.
3. An operation starts from its target environment's effective Git policy and
   recursively merges operation `git` by the same rule.
4. No layer implicitly clears an inherited member.

## Reusable commands and lifecycle invocations

Reusable executable definitions are authored under `commands`. Lifecycle
groups contain invocation objects rather than command-name strings:

```yaml
commands:
  verifyAuth:
    command: pnpm
    args: [verify:auth, --required, '{required}']
    timeout: 5m
  build:
    command: pnpm
    args: [build, --mode, '{mode}']
    timeout: 30m

steps:
  prepare:
    - use: verifyAuth
      with: { required: true }
    - use: build
      with: { mode: preview }
```

The four lifecycle groups are:

| Group     | Meaning                                                        |
| --------- | -------------------------------------------------------------- |
| `prepare` | Bounded inspection and preparation before the change boundary. |
| `change`  | Project commands that may change external or durable state.    |
| `verify`  | Post-change verification and structured result checks.         |
| `cleanup` | Bounded cleanup that runs through the cleanup lifecycle.       |

`use` is a lower camelCase command ID. `with` is an optional lower camelCase
map of string, number, or boolean values supplied to that invocation. One
definition can therefore replace variants such as `verifyAuthRequired` and
`buildPreview`.

## Operation composition

Every operation selects one real environment through `target`:

```yaml
operations:
  validateContent:
    target: prod
    provider: contentValidator
    git:
      ref:
        refresh: false
    steps:
      prepare:
        - use: build
          with: { mode: preview }
```

Composition follows one complete rule:

1. The base environment supplies `provider`, `artifacts`, `auth`, and its
   effective Git policy after top-level and environment Git composition.
2. An operation-authored `provider`, `artifacts`, or `auth` replaces the base
   value.
3. Operation `git` merges recursively into base `git`, including `ref`
   members.
4. `requires`, `steps`, `locks`, `snapshot`, and `approval` are
   operation-owned and never inherit from the base environment.
5. No other implicit clearing, replacement, or inheritance occurs.

This preserves the environment execution context while keeping every
operation-specific safety boundary visible in the operation.

## Inline approvals and snapshots

Approval policy is placed on the environment or operation that owns the
boundary:

```yaml
approval:
  message: Approve the exact production candidate
  match: PROMOTE
  automation: allowed
```

Snapshot policy is also inline:

```yaml
snapshot:
  mode: publish
  recovery: manual
  refs:
    - kind: branch
      ref: refs/heads/environments/staging
```

The parent environment or operation supplies the policy identity and purpose.
Global approval target lists, named snapshot maps, and authored snapshot
purpose IDs are rejected.

## Provider variants and validation behavior

`providers` uses strict type-specific schemas:

| Type      | Allowed fields                                                    |
| --------- | ----------------------------------------------------------------- |
| `process` | `type`, required `command`, optional `args`, `workdir`, `timeout` |
| `azd`     | `type`, optional `args`, `workdir`, `timeout`                     |

Fields from another provider type are rejected by JSON Schema. Target and
operation `mode` is not part of the contract. A validation workflow uses
ordinary lifecycle commands or selects a generic provider such as a process
provider configured for validation. Platform-specific adapters, including the
first Cloudflare implementation, are project-owned process providers rather
than central schema variants.

## Promotion identity and framework state

Top-level `name` is the stable promotion identity used by the runtime. The
authored `promote` object does not repeat it through `project`.

Run records and operation results remain distinct runtime artifacts whose paths
are compiler-owned. Reusable verification commands author the output record at
`commands.<id>.verification.path`. Authors import predecessor verifications by
stable ID instead of repeating that predecessor record's filesystem path:

```yaml
requires:
  previous:
    verifications: [stagingContent, stagingRouting]
```

Filesystem paths are not accepted in the verification ID list.

## Authentication references

Authentication values are explicit references to secrets in the target azd
environment:

```yaml
auth:
  type: basic
  username: { azd: BASIC_AUTH_USERNAME }
  password: { azd: BASIC_AUTH_PASSWORD }
```

The scalar `auth: basic` form is rejected because it depends on undeclared,
consumer-specific environment variable defaults.

## Public terminology and internal type map

| Current concept    | Public concept      | Internal Go concept  |
| ------------------ | ------------------- | -------------------- |
| Receipt            | Run record          | `RunRecord`          |
| Receipt commit     | Run record commit   | `RunRecordCommit`    |
| Source receipt     | Previous run        | `PreviousRun`        |
| Evidence           | Verification        | `VerificationRecord` |
| Proof              | Operation result    | `OperationResult`    |
| Proof policy       | Result policy       | `ResultPolicy`       |
| Promotion identity | Run context         | `RunContext`         |
| Identity digest    | Run fingerprint     | `RunFingerprint`     |
| Git provenance     | Candidate inputs    | `CandidateInputs`    |
| Imported receipt   | Imported run record | `ImportedRunRecord`  |
| Finalizer          | Cleanup step        | `CleanupStep`        |
| Finalizer health   | Cleanup status      | `CleanupStatus`      |
| Mutation           | Change              | `ChangeState`        |
| Mutation boundary  | Changed resource    | `ChangedResource`    |
| Evidence command   | Inspect command     | `InspectRun`         |
| `promote_evidence` | `promote_inspect`   | `InspectRun` adapter |

Internal storage directories follow the same model and remain compiler-owned:

```text
.azure/promote/records/
.azure/promote/verification/
.azure/promote/results/
```

## Schema design

1. Top-level `promote` uses `additionalProperties: false`.
2. All promote-owned mapping IDs use
   `propertyNames.pattern: ^[a-z][A-Za-z0-9]*$`.
3. Real environment names, file paths, lock names, resource names, and Git refs
   use their external conventions and are not forced to camelCase.
4. All nested promote objects use `additionalProperties: false`, except maps
   whose values are explicitly defined.
5. Old experimental snake_case and hyphenated framework fields are rejected.
6. An authored `version` property under `promote` is rejected.
7. Top-level `name` supplies promotion identity. Authored `project`, `records`,
   and `results` properties are rejected.
8. Authored Git policy uses `git`. The former `candidate` property is rejected.
9. Predecessor verification imports use lower camel case IDs under
   `requires.previous.verifications`. The former `previousRun` property and
   filesystem paths are rejected.
10. Auth fields use strict `{azd: NAME}` secret reference objects.
11. Reusable definitions live under `commands`; lifecycle entries use strict
    `{use, with}` invocation objects.
12. Lifecycle groups are `prepare`, `change`, `verify`, and `cleanup`.
13. Operations require `target` and follow the documented base environment
    composition rule.
14. Approvals and snapshots are inline on their owning environment or
    operation.
15. Provider variants use strict `oneOf` schemas with no mixed fields.
16. JSON Schema validates structure. Cross-reference existence and exactly one
    default among arbitrary chain entries remain runtime invariants and are
    documented and fixture-tested.

## Test strategy

1. Compile every schema with existing `pnpm validate-schema --offline`.
2. Add AJV fixture tests for:
   - complete valid promote configuration;
   - minimal one-chain promote configuration;
   - multiple-chain default examples;
   - reusable parameterized command invocations;
   - explicit prepare, change, verify, and cleanup lifecycles;
   - operations composed from real environments through `target`;
   - inline environment and operation approvals;
   - inline snapshots without one-use IDs or purpose IDs;
   - generic validation through a process provider instead of target `mode`;
   - valid process, azd, and Cloudflare Worker provider variants;
   - rejection of mixed-provider fields;
   - rejection of bare string command invocations;
   - rejection of global approvals, named snapshots, target hooks, and
     operation `environment`;
   - top-level name as promotion identity;
   - rejection of authored project, record, and result path policy;
   - Git policy under `git`;
   - stable predecessor verification IDs;
   - explicit azd secret references;
   - rejection of scalar basic authentication and raw secret names;
   - camelCase ID enforcement;
   - rejection of every old underscore field;
   - rejection of promote-owned hyphenated IDs;
   - acceptance of dashed file names and real environment/resource names;
   - strict unknown-property rejection;
   - basic, headers, and serviceToken authentication objects.
3. Add a representative full-contract fixture using neutral application,
   resource, lock, domain, path, and verification names.
4. Run `pnpm test`, `pnpm validate-schema --offline`, `pnpm check`, and
   `pnpm build`.

## Downstream adoption guidance

1. Runtime implementations adopt the exact schema before claiming v1.2
   compatibility.
2. CLI and MCP inspection surfaces use the public terminology in this design.
3. Downstream examples, documentation, and authored configurations migrate
   without compatibility aliases.
4. Each consumer validates authored and expanded plans for every environment
   and operation before deployment.
5. Deployment approval and hosted-environment verification remain
   consumer-owned concerns outside this schema definition.

## Quality gates

- Schema compiles in offline and normal validation.
- Valid fixtures pass; every legacy experimental name fixture fails.
- A fixture containing `promote.version` fails.
- Existing v1.0/v1.1-compatible fixtures remain valid.
- Top-level `name` documents promotion identity.
- `project`, `records`, `results`, `candidate`, and `previousRun` are rejected.
- Predecessor verification imports reject filesystem paths.
- Authentication rejects implicit defaults and raw secret names.
- Top-level and target `hooks`, operation `environment`, and target `mode` are
  rejected.
- Command invocations require `use`; optional `with` values are scalar and
  lower camelCase.
- Operation composition text and fixtures cover every inherited and
  operation-owned field.
- Approval and snapshot policy is inline with no global target list, snapshot
  map, or snapshot purpose ID.
- Strict provider variants reject mixed process, azd, and Cloudflare Worker
  fields.
- No promote-owned public key or ID contains `_` or `-`.
- Internal rename plan covers every exported and persisted concept.
- No compatibility aliases are introduced.
- Documentation contains one canonical schema 1.2 promote example.
- The canonical full-contract fixture passes through the isolated AJV fixture
  compiler path.
- `devx plan-check docs/specs/azd-promote-schema-1.2-overhaul/spec.md` passes.
- `git diff --check` passes.
- All repository tests, checks, and builds pass without warnings introduced by
  the change.

## Done definition

- The v1.2 schema contains the complete strict unversioned promote contract.
- The stale legacy promote schema is fully removed.
- Schema tests prove the naming and strictness decisions.
- Project identity and framework state paths are absent from authored promote
  policy.
- Git policy, predecessor verification imports, and auth secret references use
  the final schema 1.2 shape.
- Reusable parameterized commands and explicit lifecycle groups replace
  authored hooks and string references.
- Operations compose through `target` using the documented base environment
  rule.
- Approvals and snapshots are inline, target `mode` is absent, and provider
  variants are strict.
- The changelog states that the stale promote section is replaced before
  public release.
- The canonical example and fixtures use neutral public sample values.
- Downstream implementation and adoption expectations are documented without
  repository-specific rollout status.
- All quality gates pass against the final schema and examples.

## Open questions

None. The user has established the naming, compatibility, terminology, and
scope decisions needed for the schema definition.
