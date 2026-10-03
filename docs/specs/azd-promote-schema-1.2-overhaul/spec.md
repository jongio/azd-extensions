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
9. Environment-suffixed duplicate hooks are consolidated when only target
   values differ. Hooks are target-environment-driven by default.
10. The promote contract is unreleased. Old spellings are rejected; there are no aliases,
    deprecation windows, redirects, or compatibility parsing.
11. The authored `promote` object has no independent `version`. The
    `azure.yaml` `$schema` URI for v1.2 is the sole public contract version.

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
- Implement reusable hooks and environment-driven expansion.
- Implement progress counts, elapsed time, and historical estimates.

### Downstream consumer configurations

- Migrate authored `azure.yaml` files to the final schema 1.2 promote contract.
- Consolidate duplicate build, asset, verification, and smoke-test hooks where
  behavior is equivalent.
- Rename promote-owned IDs to lower camelCase.
- Keep idiomatic dashed file names such as `staging-content.json`.
- Validate every environment and operation through an offline plan before any
  deployment.

## Exclusions

- No hosted deployment.
- No staging or production mutation.
- No credential changes.
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

| Surface                         | Impact                                                                                       |
| ------------------------------- | -------------------------------------------------------------------------------------------- |
| `azd-extensions` v1.2 schema    | Complete replacement of the optional `promote` section and new definitions                   |
| Promotion runtime and compiler  | Downstream breaking migration to the exact unversioned promote contract                      |
| Runtime internal model          | Downstream rename of run record, verification, result, cleanup, change, and run context types |
| CLI and MCP adapters            | Downstream `inspect` command/tool and plain-language output                                  |
| Durable local state             | Downstream directory and schema migration before public release                              |
| Examples and website            | Follow-up replacement with one canonical schema example                                      |
| Downstream consumers            | Authored-config migration and reusable-hook consolidation                                    |
| Existing azd v1.0/v1.1 schema   | No change                                                                                    |
| Hosted environments             | No change in this schema definition                                                          |

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
6. Candidate policy uses `worktree`, `upstream`, and `ref` states, with no
   requirement booleans.
7. The schema uses run record, previous run, verification, operation result,
   cleanup, change, and inspection terminology.
8. Valid minimal and full promote fixtures pass.
9. Fixtures containing old underscore keys, promote-owned hyphenated IDs, or
   unknown fields fail.
10. Dashed file names and real external names remain valid.
11. `pnpm test`, `pnpm validate-schema --offline`, `pnpm check`, and
    `pnpm build` pass.
12. The changelog and design explain the breaking pre-release replacement and
    downstream adoption expectations.

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
- **Hook duplication:** consolidate environment suffixes when behavior is
  configuration-driven.
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
promote:
  project:
    id: sampleApp

  chains:
    release:
      default: true
      targets: [dev, staging, prod]

  candidate:
    worktree: clean
    upstream: published

  approvals:
    targets: [staging, prod, publishContent, activateContent]
    message: Approve the exact candidate and reviewed content
    match: PROMOTE
    automation: allowed

  records:
    path: '.azure/promote/records/{target}.json'

  results:
    path: '.azure/promote/results/{target}/{artifact}.json'

  snapshots:
    stagingRelease:
      purpose: verifiedStaging
      mode: publish
      recovery: manual
      refs:
        - kind: branch
          ref: refs/heads/environments/staging

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
    cloudflare:
      type: cloudflareWorker
      config: deploy/content-app/wrangler.jsonc
      secrets:
        - DEPLOY_API_TOKEN
      variables:
        CONTENT_APP_REGION: DEPLOY_REGION
      message: sampleApp {environment} promotion

  environments:
    dev:
      provider: cloudflare
      artifacts: [contentApp]
      candidate:
        worktree: dirtyAllowed
      auth: basic
      hooks:
        before:
          [
            verifyCredentials,
            checkAssetStore,
            migrateData,
            verifyData,
            buildContentApp,
            pruneOutput,
            normalizeOutput,
            verifyOfflineOutput,
            selectFiles,
            removeUnusedFiles,
          ]
        apply: [publishAssets, configureAssetCors]
        after: [runSmokeTests, verifyLiveSite]

    staging:
      provider: cloudflare
      artifacts: [contentApp]
      auth: basic
      snapshot: stagingRelease
      hooks:
        before:
          [
            verifyCredentials,
            checkAssetStore,
            migrateData,
            verifyData,
            buildContentApp,
            pruneOutput,
            normalizeOutput,
            verifyOfflineOutput,
            selectFiles,
            removeUnusedFiles,
          ]
        apply: [publishAssets, configureAssetCors]
        after: [runSmokeTests, verifyLiveSite]

    prod:
      provider: cloudflare
      artifacts: [contentApp]
      candidate:
        worktree: clean
        ref:
          exact: origin/main
          refresh: true
      previousRun:
        files:
          - .azure/promote/verification/staging-content.json
          - .azure/promote/verification/staging-routing.json
      hooks:
        before:
          [
            prepareProductionData,
            verifyPublisherApproval,
            prepareProductionRelease,
            verifyCredentials,
            checkAssetStore,
            verifyData,
            buildContentApp,
            pruneOutput,
            normalizeOutput,
            verifyOfflineOutput,
            selectFiles,
            removeUnusedFiles,
          ]
        apply: [verifyDeploymentInputs, deployContentApp]
        after: [runSmokeTests, verifyLiveSite, verifyPublishedContent]

  operations:
    publishContent:
      environment: prod
      hooks:
        before:
          [
            verifyPreparedContent,
            verifyCredentials,
            checkAssetStore,
            verifyData,
            buildContentApp,
            pruneOutput,
            normalizeOutput,
            verifyOfflineOutput,
            selectFiles,
            removeUnusedFiles,
          ]
        apply: [verifyContentInputs, deployContentApp]
        after: [runSmokeTests, verifyLiveSite, verifyPublishedContent]

    validateContent:
      environment: prod
      mode: validate
      hooks:
        before:
          [
            verifyCredentials,
            checkAssetStore,
            verifyData,
            buildContentPreview,
            pruneOutput,
            normalizeOutput,
            verifyOfflineOutput,
            selectFiles,
            removeUnusedFiles,
          ]

    activateContent:
      environment: prod
      hooks:
        before:
          [
            verifyCredentials,
            checkAssetStore,
            verifyData,
            buildContentApp,
            pruneOutput,
            normalizeOutput,
            verifyOfflineOutput,
            selectFiles,
            removeUnusedFiles,
          ]
        apply: [verifyContentInputs, deployContentApp]
        after: [runSmokeTests, verifyLiveSite, verifyPublishedContent]

  hooks:
    verifyCredentials:
      effect: inspection
      command: node
      args: [scripts/verify-credentials.mjs]
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
      args:
        [
          scripts/verify-data.mjs,
          --record,
          '.azure/promote/verification/{workflow}-data.json',
        ]
      verification:
        path: '.azure/promote/verification/{workflow}-data.json'
      timeout: 10m

    buildContentApp:
      command: node
      args: [scripts/build-content-app.mjs]
      timeout: 30m

    buildContentPreview:
      command: node
      args: [scripts/build-content-preview.mjs]
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

    deployContentApp:
      effect: change
      command: node
      args: [scripts/deploy-content-app.mjs]
      timeout: 30m

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

## Candidate rules

```yaml
candidate:
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

## Public terminology and internal type map

| Current concept      | Public concept      | Internal Go concept  |
| -------------------- | ------------------- | -------------------- |
| Receipt              | Run record          | `RunRecord`          |
| Receipt commit       | Run record commit   | `RunRecordCommit`    |
| Source receipt       | Previous run        | `PreviousRun`        |
| Evidence             | Verification        | `VerificationRecord` |
| Proof                | Operation result    | `OperationResult`    |
| Proof policy         | Result policy       | `ResultPolicy`       |
| Promotion identity   | Run context         | `RunContext`         |
| Identity digest      | Run fingerprint     | `RunFingerprint`     |
| Candidate provenance | Candidate inputs    | `CandidateInputs`    |
| Imported receipt     | Imported run record | `ImportedRunRecord`  |
| Finalizer            | Cleanup step        | `CleanupStep`        |
| Finalizer health     | Cleanup status      | `CleanupStatus`      |
| Mutation             | Change              | `ChangeState`        |
| Mutation boundary    | Changed resource    | `ChangedResource`    |
| Evidence command     | Inspect command     | `InspectRun`         |
| `promote_evidence`   | `promote_inspect`   | `InspectRun` adapter |

Internal storage directories follow the same model:

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
7. JSON Schema validates structure. Cross-reference existence and exactly one
   default among arbitrary chain entries remain runtime invariants and are
   documented and fixture-tested.

## Test strategy

1. Compile every schema with existing `pnpm validate-schema --offline`.
2. Add AJV fixture tests for:
   - complete valid promote configuration;
   - minimal one-chain promote configuration;
   - multiple-chain default examples;
   - reusable environment-driven hooks;
   - operations bound to real environments;
   - camelCase ID enforcement;
   - rejection of every old underscore field;
   - rejection of promote-owned hyphenated IDs;
   - acceptance of dashed file names and real environment/resource names;
   - strict unknown-property rejection;
   - auth scalar and mapping forms.
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
- No promote-owned public key or ID contains `_` or `-`.
- Internal rename plan covers every exported and persisted concept.
- No compatibility aliases are introduced.
- Documentation contains one canonical schema 1.2 promote example.
- All repository tests, checks, and builds pass without warnings introduced by
  the change.

## Done definition

- The v1.2 schema contains the complete strict unversioned promote contract.
- The stale legacy promote schema is fully removed.
- Schema tests prove the naming and strictness decisions.
- The changelog states that the stale promote section is replaced before
  public release.
- The canonical example and fixtures use neutral public sample values.
- Downstream implementation and adoption expectations are documented without
  repository-specific rollout status.
- All quality gates pass against the final schema and examples.

## Open questions

None. The user has established the naming, compatibility, terminology, and
scope decisions needed for the schema definition.
