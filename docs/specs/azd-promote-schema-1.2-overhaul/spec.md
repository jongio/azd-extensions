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
`requires.predecessor.verifications`.

Reusable process definitions are authored under `commands`. Reusable ordered
command groups are authored under `tasks`. Environments and operations
compose an explicit `workflow` whose `prepare`, `apply`, `verify`, and
`cleanup` lifecycles invoke tasks with `task` and optional `with`
parameters. Tasks invoke command steps with `command` and optional `with`
parameters. Operations compose from one real environment through `environment`
using the complete rule documented below.

## User decisions

1. `default_chain` is rejected. The default belongs inside the chain.
2. A single chain is selected automatically. Multiple chains require exactly
   one `default: true`.
3. `require_clean` and other `require_*` booleans are rejected. Policies use
   nested state values.
4. Every underscore, hyphen, and capital letter is audited in the authored
   `promote` schema. Schema-owned fields use lower camelCase; authored
   identifiers use lowercase kebab-case.
5. File names, paths, CLI flags, environment variables, external resource
   names, and real azd environment names may retain idiomatic hyphens.
6. `catalog` is not a framework concept. Operation IDs use verb-first,
   application-neutral, lowercase kebab-case names such as `publish-content`,
   `validate-content`, and `activate-content`.
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
    `requires.predecessor.verifications`, not authored filesystem paths.
16. Verification-authentication values use explicit azd secret references.
    Scalar `verificationAuth: basic` defaults are rejected.
17. Reusable executable definitions use `commands`, reusable ordered command
    groups use `tasks`, and target orchestration uses `workflow`.
18. Lifecycle groups are `prepare`, `apply`, `verify`, and `cleanup`.
19. Every workflow lifecycle entry invokes one task through `task` and
    optional scalar `with` parameters. Every task step invokes one command
    through `command` and optional scalar `with` parameters. Bare strings are
    rejected and tasks cannot nest.
20. Operations bind to a base environment through `environment`. They inherit
    provider, artifacts, verification auth, and Git policy only, with recursive
    Git merging. Requirements, workflow, locks, Git snapshots, and approvals remain
    operation-owned.
21. Approval policy is inline on the environment or operation that owns the
    boundary. A global approval target list is rejected.
22. Git snapshot policy is inline on its environment or operation. Named one-use
    snapshot IDs and repeated purpose IDs are rejected.
23. Target `mode` is removed. Validation uses ordinary command invocations and
    an operation-authored `deploy: false` boundary instead of a fake deployment
    provider.
24. Provider schemas are strict per type. Process, azd, and Cloudflare Worker
    fields cannot be mixed.

## Scope

### This repository

- Replace `schemas/v1.2/azure.yaml.json` promote schema.
- Add strict promote definitions with lower camelCase schema fields and
  lowercase kebab-case promote-owned ID patterns.
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
- Implement reusable parameterized tasks and commands with deterministic
  workflow expansion.
- Implement the documented target-based operation composition rule.
- Implement progress counts, elapsed time, and historical estimates.

### Downstream consumer configurations

- Migrate authored `azure.yaml` files to the final schema 1.2 promote contract.
- Consolidate duplicate build, asset, verification, and smoke-test commands
  and command sequences where behavior is equivalent.
- Rename promote-owned IDs to lowercase kebab-case.
- Keep idiomatic dashed file names such as `staging-content.json`.
- Validate every environment and operation through an offline plan before any
  deployment.

## Exclusions

- No hosted deployment.
- No staging or production mutation.
- No credential changes.
- No azd-promote runtime implementation.
- No provider protocol implementation.
- No downstream consumer changes.
- No backward-compatible aliases for old experimental promote names.
- No authored `promote.version` field.
- No rename of core azd v1.0/v1.1 keys.
- No ban on hyphens in file paths, CLI flags, environment variables, Azure
  resource names, Git refs, or externally owned identifiers.

## Convention Discovery

- azd core and azd-app schema keys use lower camelCase for modern authored
  fields such as `resourceGroup`, `requiredVersions`, `readyPattern`,
  `healthCheck`, and `urlPath`, while the official azd project-name boundary
  permits lowercase letters, numbers, and hyphens.
- Kubernetes follows the same semantic split: API fields use lower camelCase
  while resource names use lowercase DNS-style identifiers with hyphens.
- GitHub Actions and Docker Compose use different schema-key styles
  (kebab-case and snake_case respectively), confirming that YAML itself does
  not define one casing convention.
- Helm recommends lower camelCase values while using dashed chart and template
  names. The cross-ecosystem convention is therefore role-based rather than
  one casing style for every authored token.
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

Primary convention sources:

- [Azure Developer CLI `azure.yaml` schema](https://learn.microsoft.com/azure/developer/azure-developer-cli/azd-schema)
- [YAML 1.2.2 specification](https://yaml.org/spec/1.2.2/)
- [Kubernetes object names](https://kubernetes.io/docs/concepts/overview/working-with-objects/names/)
- [GitHub Actions workflow syntax](https://docs.github.com/actions/reference/workflows-and-actions/workflow-syntax)
- [Docker Compose file reference](https://docs.docker.com/reference/compose-file/)
- [Helm values best practices](https://helm.sh/docs/chart_best_practices/values/)

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
3. Promote-owned YAML schema fields use lower camelCase.
4. Promote-owned IDs use lowercase kebab-case and reject uppercase letters,
   underscores, leading or trailing hyphens, and empty segments. Real azd
   environment names, paths, external resources, locks, refs, CLI flags, and
   environment variables remain valid with their native conventions.
5. Chains use nested `{default, targets}` objects. One chain auto-selects;
   multiple chains require one runtime-selected default.
6. Git policy uses `worktree`, `upstream`, and `ref` states, with no requirement
   booleans.
7. Top-level `name` is documented as promotion identity.
8. `project`, `records`, `results`, `candidate`, and `previousRun` are rejected
   under `promote`.
9. Predecessor verification imports use stable lowercase kebab-case IDs, not
   filesystem paths.
10. Authentication values use explicit azd secret references.
11. The schema uses run record, previous run, verification, operation result,
    cleanup, change, and inspection terminology.
12. Valid minimal and full promote fixtures pass.
13. Fixtures containing old underscore keys, promote-owned camelCase IDs, or
    unknown fields fail.
14. Dashed file names and real external names remain valid.
15. Existing v1.0 and v1.1 schema behavior remains unchanged.
16. `pnpm test`, `pnpm validate-schema --offline`, `pnpm check`, and
    `pnpm build` pass.
17. The changelog and design explain the breaking pre-release replacement and
    downstream adoption expectations.
18. Reusable definitions are authored under `commands`; top-level and target
    `hooks` are rejected.
19. Lifecycle groups use `prepare`, `apply`, `verify`, and `cleanup`.
20. Command invocations use `{command, with}` objects, and one definition is reused
    with different parameter values in the canonical fixture.
21. Operation composition is defined by `environment` and the documented base
    environment rule. The former operation `target` field is rejected.
22. Approvals and Git snapshots are inline on environments and operations. Global
    approval lists, named Git snapshot maps, and snapshot purpose IDs are rejected.
23. Target `mode` is rejected. `deploy: false` explicitly compiles a
    validation-only operation without provider steps, operation results,
    deployment verification, or live-file HTTP verification.
24. Provider variants are strict and type-specific. Mixed-provider fields fail
    JSON Schema validation.
25. Encoded duplicate IDs such as `stagingRelease`,
    `verify-authRequired`, and `build-preview` are unnecessary in the canonical
    contract.

## Pre-Completion Interview

All material choices are resolved by the user:

- **Default chain:** nested `default: true`; automatic when only one chain.
- **Separator policy:** schema fields remain lower camelCase; promote-owned IDs
  use lowercase kebab-case. External names retain their native conventions.
- **File naming:** idiomatic dashed file names remain valid.
- **Domain naming:** `catalog` is not a generic framework concept.
- **Terminology:** replace evidence, receipt, and proof publicly and internally.
- **Internal consistency:** Go types and functions mirror public schema
  concepts.
- **Command duplication:** consolidate environment suffixes when behavior is
  invocation-parameter-driven.
- **Operation composition:** `environment` selects the base environment; only
  provider, artifacts, verification auth, and Git policy inherit.
- **Inline policy:** approvals and Git snapshots live on the environment or
  operation that owns them.
- **Provider behavior:** validation uses commands plus `deploy: false` rather
  than target `mode` or a fake deployment provider.
- **Compatibility:** no aliases because the promote contract is unreleased.
- **Versioning:** `$schema` v1.2 is the only authored version; durable records
  and API/event formats retain independent internal versions.

No further interview decision blocks the schema definition.

## Gut-Check Results

- **Greenfield reframe:** The recommended schema is the design we would choose
  from scratch: strict, nested, lower camelCase for schema fields, lowercase
  kebab-case for authored IDs, convention-driven, and free of stale
  phase-specific orchestration.
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
| Promote-owned IDs          | lowercase kebab-case                     |
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
    content-app:
      type: static
      path: dist/content-app
      identityPaths:
        - azure.yaml
        - pnpm-lock.yaml
      sealedPaths:
        - '.azure/promote/verification/{target}-selected-files.json'
      liveFiles:
        - path: content-index.json

  providers:
    content-publisher:
      type: process
      executable: node
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
    azure-fallback:
      type: azd
      args: [--all]
      workdir: infra
      timeout: 30m

  tasks:
    access-preflight:
      steps:
        - command: verify-auth
          with: { required: '{auth-required}' }
        - command: check-asset-store
    build-output:
      steps:
        - command: build
          with: { mode: '{build-mode}' }
        - command: prune-output
        - command: normalize-output
    data-change:
      steps:
        - command: migrate-data
    asset-publish:
      steps:
        - command: publish-assets
        - command: configure-asset-cors
    output-verification:
      steps:
        - command: verify-data
        - command: verify-offline-output
        - command: select-files
    live-verification:
      steps:
        - command: run-smoke-tests
          with: { suite: '{smoke-suite}' }
        - command: verify-live-site
    cleanup-output:
      steps:
        - command: remove-unused-files
    publisher-approval:
      steps:
        - command: verify-publisher-approval
    production-release-change:
      steps:
        - command: prepare-production-data
        - command: prepare-production-release
    deployment-input-verification:
      steps:
        - command: verify-deployment-inputs
    published-content-verification:
      steps:
        - command: verify-published-content
    prepared-content-verification:
      steps:
        - command: verify-prepared-content
    content-input-verification:
      steps:
        - command: verify-content-inputs
    deployment-validation:
      steps:
        - command: validate-content

  environments:
    dev:
      provider: content-publisher
      artifacts: [content-app]
      git:
        worktree: dirtyAllowed
      verificationAuth:
        type: basic
        username: { azd: DEV_BASIC_AUTH_USERNAME }
        password: { azd: DEV_BASIC_AUTH_PASSWORD }
      workflow:
        prepare:
          - task: access-preflight
            with: { auth-required: false }
          - task: build-output
            with: { build-mode: release }
        apply:
          - task: data-change
          - task: asset-publish
        verify:
          - task: output-verification
          - task: live-verification
            with: { smoke-suite: fast }
        cleanup:
          - task: cleanup-output

    staging:
      provider: content-publisher
      artifacts: [content-app]
      verificationAuth:
        type: basic
        username: { azd: STAGING_BASIC_AUTH_USERNAME }
        password: { azd: STAGING_BASIC_AUTH_PASSWORD }
      approval:
        message: Approve the exact staging candidate
        match: PROMOTE
        automation: allowed
      gitSnapshot:
        mode: publish
        recovery: manual
        refs:
          - kind: branch
            ref: refs/heads/environments/staging
      workflow:
        prepare:
          - task: access-preflight
            with: { auth-required: true }
          - task: build-output
            with: { build-mode: release }
        apply:
          - task: data-change
          - task: asset-publish
        verify:
          - task: output-verification
          - task: live-verification
            with: { smoke-suite: full }
        cleanup:
          - task: cleanup-output

    prod:
      provider: content-publisher
      artifacts: [content-app]
      git:
        worktree: clean
        ref:
          exact: origin/main
          refresh: true
      requires:
        predecessor:
          verifications: [staging-content, staging-routing]
      approval:
        message: Approve the exact production candidate
        match: PROMOTE
        automation: allowed
      gitSnapshot:
        mode: publish
        recovery: manual
        refs:
          - kind: tag
            template: refs/tags/releases/{gitSha}
      workflow:
        prepare:
          - task: publisher-approval
          - task: access-preflight
            with: { auth-required: true }
          - task: build-output
            with: { build-mode: release }
        apply:
          - task: production-release-change
        verify:
          - task: output-verification
          - task: deployment-input-verification
          - task: live-verification
            with: { smoke-suite: full }
          - task: published-content-verification
        cleanup:
          - task: cleanup-output

  operations:
    publish-content:
      environment: prod
      locks: [content:production, deployment:production]
      approval:
        message: Approve publishing the reviewed content
        match: PUBLISH
        automation: denied
      gitSnapshot:
        mode: publish
        recovery: manual
        refs:
          - kind: tag
            template: refs/tags/content/{gitSha}
      workflow:
        prepare:
          - task: prepared-content-verification
          - task: access-preflight
            with: { auth-required: true }
          - task: build-output
            with: { build-mode: release }
        verify:
          - task: output-verification
          - task: content-input-verification
          - task: live-verification
            with: { smoke-suite: full }
          - task: published-content-verification
        cleanup:
          - task: cleanup-output

    validate-content:
      environment: prod
      deploy: false
      locks: [content:production-candidate]
      workflow:
        prepare:
          - task: access-preflight
            with: { auth-required: true }
          - task: build-output
            with: { build-mode: preview }
        verify:
          - task: output-verification
          - task: deployment-validation
        cleanup:
          - task: cleanup-output

    activate-content:
      environment: prod
      locks: [content:production, deployment:production]
      approval:
        message: Approve activation of the exact candidate
        match: ACTIVATE
        automation: denied
      gitSnapshot:
        mode: verify
        recovery: manual
        refs:
          - kind: branch
            ref: refs/heads/environments/production
      workflow:
        prepare:
          - task: access-preflight
            with: { auth-required: true }
          - task: build-output
            with: { build-mode: release }
        verify:
          - task: output-verification
          - task: content-input-verification
          - task: live-verification
            with: { smoke-suite: full }
          - task: published-content-verification
        cleanup:
          - task: cleanup-output

  commands:
    verify-auth:
      effect: inspection
      executable: node
      args: [scripts/verify-credentials.mjs, --required, '{required}']
      inspectionOnly: true
      timeout: 5m

    check-asset-store:
      executable: node
      args: [scripts/check-resource.mjs, content-assets]
      timeout: 5m

    migrate-data:
      effect: change
      executable: node
      args: [scripts/migrate-data.mjs]
      timeout: 30m

    verify-data:
      effect: verification
      executable: node
      args: [scripts/verify-data.mjs, --record, '.azure/promote/verification/{target}-data.json']
      verification:
        path: '.azure/promote/verification/{target}-data.json'
      timeout: 10m

    build:
      executable: node
      args: [scripts/build-content-app.mjs, --mode, '{mode}']
      timeout: 30m

    prune-output:
      executable: node
      args: [scripts/prune-output.mjs, dist/content-app]
      timeout: 10m

    normalize-output:
      executable: node
      args: [scripts/normalize-output.mjs, dist/content-app]
      timeout: 10m

    validate-content:
      executable: node
      args:
        [
          scripts/validate-content-app.mjs,
          --artifact,
          '{artifact}',
          --environment,
          '{environment}',
        ]
      timeout: 30m

    verify-offline-output:
      effect: verification
      executable: node
      args:
        [
          scripts/verify-offline-output.mjs,
          --record,
          '.azure/promote/verification/{target}-offline-output.json',
        ]
      verification:
        path: '.azure/promote/verification/{target}-offline-output.json'
      timeout: 10m

    publish-assets:
      effect: change
      executable: node
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

    select-files:
      effect: verification
      executable: node
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
          '.azure/promote/verification/{target}-selected-files.json',
        ]
      verification:
        path: '.azure/promote/verification/{target}-selected-files.json'
      timeout: 1h

    remove-unused-files:
      executable: node
      args: [scripts/remove-unused-files.mjs, dist/content-app]
      timeout: 10m

    configure-asset-cors:
      effect: change
      executable: node
      args: [scripts/configure-asset-cors.mjs, content-assets]
      timeout: 10m

    run-smoke-tests:
      effect: verification
      executable: node
      args:
        [
          scripts/run-smoke-tests.mjs,
          --suite,
          '{suite}',
          --record,
          '.azure/promote/verification/{target}-smoke.json',
        ]
      verification:
        path: '.azure/promote/verification/{target}-smoke.json'
      timeout: 15m

    verify-live-site:
      effect: verification
      executable: node
      args:
        [
          scripts/verify-live-site.mjs,
          --record,
          '.azure/promote/verification/{target}-live-site.json',
        ]
      verification:
        path: '.azure/promote/verification/{target}-live-site.json'
      timeout: 15m

    prepare-production-data:
      effect: change
      executable: node
      args: [scripts/prepare-production-data.mjs]
      timeout: 30m

    verify-publisher-approval:
      effect: verification
      executable: node
      args:
        [
          scripts/verify-publisher-approval.mjs,
          --record,
          '.azure/promote/verification/{target}-publisher-approval.json',
        ]
      verification:
        path: '.azure/promote/verification/{target}-publisher-approval.json'
      timeout: 5m

    prepare-production-release:
      effect: change
      executable: node
      args: [scripts/prepare-production-release.mjs]
      timeout: 30m

    verify-deployment-inputs:
      effect: verification
      executable: node
      args:
        [
          scripts/verify-deployment-inputs.mjs,
          --record,
          '.azure/promote/verification/{target}-deployment-inputs.json',
        ]
      verification:
        path: '.azure/promote/verification/{target}-deployment-inputs.json'
      timeout: 10m

    verify-published-content:
      effect: verification
      executable: node
      args:
        [
          scripts/verify-published-content.mjs,
          --record,
          '.azure/promote/verification/{target}-published-content.json',
        ]
      verification:
        path: '.azure/promote/verification/{target}-published-content.json'
      timeout: 10m

    verify-prepared-content:
      effect: verification
      executable: node
      args:
        [
          scripts/verify-prepared-content.mjs,
          --record,
          '.azure/promote/verification/{target}-prepared-content.json',
        ]
      verification:
        path: '.azure/promote/verification/{target}-prepared-content.json'
      timeout: 10m

    verify-content-inputs:
      effect: verification
      executable: node
      args:
        [
          scripts/verify-content-inputs.mjs,
          --record,
          '.azure/promote/verification/{target}-content-inputs.json',
        ]
      verification:
        path: '.azure/promote/verification/{target}-content-inputs.json'
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
3. An operation starts from its base environment's effective Git policy and
   recursively merges operation `git` by the same rule.
4. No layer implicitly clears an inherited member.

## Reusable tasks, commands, and workflows

Reusable executable definitions are authored under `commands`. Reusable
ordered command groups are authored under `tasks`. Targets compose a
`workflow` from task invocations:

```yaml
commands:
  verify-auth:
    executable: pnpm
    args: [verify:auth, --required, '{required}']
    timeout: 5m
  build:
    executable: pnpm
    args: [build, --mode, '{mode}']
    timeout: 30m

tasks:
  hosting-preflight:
    steps:
      - command: verify-auth
        with: { required: '{auth-required}' }
  file-prep:
    steps:
      - command: build
        with: { mode: '{build-mode}' }

workflow:
  prepare:
    - task: hosting-preflight
      with: { auth-required: true }
    - task: file-prep
      with: { build-mode: preview }
```

The four lifecycle groups are:

| Group     | Meaning                                                        |
| --------- | -------------------------------------------------------------- |
| `prepare` | Bounded inspection and preparation before the change boundary. |
| `apply`   | Project commands that may change external or durable state.    |
| `verify`  | Post-apply verification and structured result checks.          |
| `cleanup` | Bounded cleanup that runs through the cleanup lifecycle.       |

Workflow entries use a lowercase kebab-case `task` ID. Task steps use a
lowercase kebab-case command ID under `command`. Both invocation types accept an
optional lowercase kebab-case `with` map of string, number, or boolean values.
An exact task parameter placeholder such as `'{auth-required}'` preserves
the supplied scalar type when passed into a command step. Tasks cannot
invoke other tasks; the compiler flattens them deterministically and
retains task identity in expanded plans.

## Operation composition

Every operation selects one real environment through `environment`:

```yaml
operations:
  validate-content:
    environment: prod
    deploy: false
    git:
      ref:
        refresh: false
    workflow:
      prepare:
        - task: file-prep
          with: { build-mode: preview }
```

Composition follows one complete rule:

1. The base environment supplies `provider`, `artifacts`, `verificationAuth`, and its
   effective Git policy after top-level and environment Git composition.
2. An operation-authored `provider`, `artifacts`, or `verificationAuth`
   replaces the base value. A provider override cannot be combined with
   `deploy: false`.
3. Operation `git` merges recursively into base `git`, including `ref`
   members.
4. `requires`, `workflow`, `locks`, `gitSnapshot`, and `approval` are
   operation-owned and never inherit from the base environment.
5. `deploy` defaults to true. `deploy: false` preserves artifact
   fingerprinting, sealing, lifecycle commands, and final artifact verification
   while suppressing provider expansion, operation-result creation, deployment
   verification, and `liveFiles` HTTP verification.
6. No other implicit clearing, replacement, or inheritance occurs.

This preserves the environment execution context while keeping every
operation-specific safety boundary visible in the operation.

## Inline approvals and Git snapshots

Approval policy is placed on the environment or operation that owns the
boundary:

```yaml
approval:
  message: Approve the exact production candidate
  match: PROMOTE
  automation: allowed
```

Git snapshot policy is also inline:

```yaml
gitSnapshot:
  mode: publish
  recovery: manual
  refs:
    - kind: branch
      ref: refs/heads/environments/staging
```

The parent environment or operation supplies the policy identity and purpose.
Global approval target lists, named Git snapshot maps, and authored snapshot
purpose IDs are rejected.

## Provider variants and validation behavior

`providers` uses strict type-specific schemas:

| Type      | Allowed fields                                                       |
| --------- | -------------------------------------------------------------------- |
| `process` | `type`, required `executable`, optional `args`, `workdir`, `timeout` |
| `azd`     | `type`, optional `args`, `workdir`, `timeout`                        |

Fields from another provider type are rejected by JSON Schema. Target and
operation `mode` is not part of the contract. A validation workflow uses
ordinary lifecycle commands with `deploy: false`, so it does not fabricate a
deployment operation result. Platform-specific adapters, including the first
Cloudflare implementation, are project-owned process providers rather than
central schema variants.

## Promotion identity and framework state

Top-level `name` is the stable promotion identity used by the runtime. The
authored `promote` object does not repeat it through `project`.

Run records and operation results remain distinct runtime artifacts whose paths
are compiler-owned. Reusable verification commands author the output record at
`commands.<id>.verification.path`. Authors import predecessor verifications by
stable ID instead of repeating that predecessor record's filesystem path:

```yaml
requires:
  predecessor:
    verifications: [staging-content, staging-routing]
```

Filesystem paths are not accepted in the verification ID list.

## Authentication references

Verification-authentication values are explicit references to secrets in the
target azd environment:

```yaml
verificationAuth:
  type: basic
  username: { azd: BASIC_AUTH_USERNAME }
  password: { azd: BASIC_AUTH_PASSWORD }
```

The scalar `verificationAuth: basic` form is rejected because it depends on
undeclared, consumer-specific environment variable defaults.

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
   `propertyNames.pattern: ^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$`.
3. Real environment names, file paths, lock names, resource names, and Git refs
   use their external conventions and are not forced to camelCase.
4. All nested promote objects use `additionalProperties: false`, except maps
   whose values are explicitly defined.
5. Old experimental snake_case and hyphenated framework fields are rejected.
6. An authored `version` property under `promote` is rejected.
7. Top-level `name` supplies promotion identity. Authored `project`, `records`,
   and `results` properties are rejected.
8. Authored Git policy uses `git`. The former `candidate` property is rejected.
9. Predecessor verification imports use lowercase kebab-case IDs under
   `requires.predecessor.verifications`. The former `previousRun` property and
   filesystem paths are rejected.
10. `verificationAuth` fields use strict `{azd: NAME}` secret reference objects.
11. Reusable executable definitions live under `commands`; reusable ordered
    command groups live under `tasks`; targets compose them under
    `workflow`.
12. Workflow lifecycle groups are `prepare`, `apply`, `verify`, and
    `cleanup`. Workflow entries use strict `{task, with}` invocations, and
    task steps use strict `{command, with}` command invocations. Tasks cannot
    nest.
13. Operations require `environment`, support explicit `deploy: false`, and follow
    the documented base environment composition rule.
14. Approvals and Git snapshots are inline on their owning environment or
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
   - reusable parameterized task and command invocations;
   - explicit prepare, apply, verify, and cleanup workflows;
   - operations composed from real environments through `environment`;
   - inline environment and operation approvals;
   - inline Git snapshots without one-use IDs or purpose IDs;
   - validation through lifecycle commands plus `deploy: false` instead of
     target `mode` or a fake provider;
   - valid process and azd provider variants;
   - rejection of mixed-provider fields;
   - rejection of flat target steps, nested tasks, empty tasks, and bare
     string command invocations;
   - rejection of global approvals, named snapshots, target hooks, and
     operation `target`;
   - top-level name as promotion identity;
   - rejection of authored project, record, and result path policy;
   - Git policy under `git`;
   - stable predecessor verification IDs;
   - explicit azd secret references;
   - rejection of scalar basic verification authentication and raw secret names;
   - lowercase kebab-case ID enforcement;
   - rejection of every old underscore field;
   - rejection of promote-owned camelCase and underscore IDs;
   - acceptance of dashed file names and real environment/resource names;
   - strict unknown-property rejection;
   - basic, headers, and serviceToken verification-authentication objects.
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
- Verification authentication rejects implicit defaults and raw secret names.
- Top-level and target `hooks`, operation `target`, and target `mode` are
  rejected.
- Workflow invocations require `task`; command invocations require `command`;
  optional `with` values are scalar and parameter IDs use lowercase
  kebab-case.
- Operation composition text and fixtures cover every inherited and
  operation-owned field.
- Approval and Git snapshot policy is inline with no global target list, named
  Git snapshot map, or snapshot purpose ID.
- Strict provider variants reject mixed process and azd fields.
- No promote-owned ID contains uppercase letters or `_`; multiword IDs use
  single hyphens between lowercase alphanumeric segments.
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
- Reusable parameterized tasks and commands plus explicit workflows replace
  authored hooks, flat command lists, and string references.
- Operations compose through `environment` using the documented base environment
  rule.
- Approvals and Git snapshots are inline, target `mode` is absent, and provider
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
