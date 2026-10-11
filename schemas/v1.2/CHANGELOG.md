# azure.yaml Schema Changelog

## v1.2 reconciliation

**Schema location**: `schemas/v1.2/azure.yaml.json`
**$id**: `https://raw.githubusercontent.com/jongio/azd-extensions/main/schemas/v1.2/azure.yaml.json`

This update intentionally replaces the publicly available v1.2 experimental
promote contract with the strict contract from draft #167. It also updates the
aggregate to Draft 2019-09 and released azd 1.31.2 native features. This is not
a universally backward-compatible replacement: consumers of the old promote
shape must migrate. Existing azd-app v1.1 files, runtime behavior and default
init schema selection are not changed; no azd-app mirror PR is required.

### Sources and coordination with #167

- Native Azure schema: released azd 1.31.2, commit
  `3440050737c18537ae6cdbd1d64b98c594c495ad`.
- Legacy app compatibility: jongio/azd-app commit
  `a052d020ec1237ddbf922dfe6baa87e0a6b52b37`, schemas/v1.1/azure.yaml.json.
- Strict promote: draft #167 head
  `7dbee487cc96ad8650ce4c9285972b68b82775dc`.
  `promote.schema.json` is deterministically extracted from its complete promote
  definition graph. Its 66 valid/invalid fixtures are reused without reauthoring.

This new PR overlaps #167 at `schemas/v1.2/azure.yaml.json` and this changelog.
It integrates that PR's design spec and original test assertions locally, but
does not edit the existing PR or its branch. The original assertions retain
their exact expected instance errors and contract checks; only their compiler
and schema inspection loaders are adapted to the real graph and fragment.
The integrated design's opening note supersedes its historical unreleased
rationale without changing its contract ownership, rules or canonical example.
Before either PR
merges, coordinate the overlap: retain the audited promote definition source
and fixtures, and do not overwrite this native/dialect/reference reconciliation
with #167's older Draft-07 aggregate. If the audited contract changes, update
the pinned source explicitly and regenerate; do not hand-edit the fragment.
The contract-first design in #167 remains the source of the promote naming,
ownership and runtime adoption rules, not a second independently maintained
promote definition here.

`sources/manifest.json` records immutable retrieval URLs, Git blob IDs and
SHA-256 hashes. Original bytes are retained under sources; served dependencies
are rebased under vendor. Foundry's relative references and mutable source IDs
are rebased as well. Source data is excluded from schema compilation.
Scoped Git attributes preserve exact source bytes and generated LF output
across Windows and Linux checkouts.

### Native and app compatibility boundaries

Native hooks support arrays, language executors, config, secrets, working
directories and platform overrides, including stable infra.layers hooks.
App-only prerun/postrun/prestop/poststop use a separate shell-hook grammar.
The prestop/poststop omission was a pre-existing schema/runtime gap, not a
regression introduced by #167. Arrays remain schema-valid for legacy editor
compatibility, but the azd app runtime executes only single hook objects.
This schema does not enable new runtime capabilities.

Services, resources and infra retain explicit legacy acceptance branches.
These intentionally preserve permissive legacy authoring and may accept
configurations that do not meet newer native host/layer constraints. The native
branch retains upstream constraints unchanged; the aggregate is not a strict
native-only validator. Existing app fields including pull_policy, volumes,
local, azure, uses, logs and test are preserved.

Strict promote requires named chains, environments, artifacts and providers.
It also supports operations, reusable tasks and commands, workflows, Git
policy, approvals, snapshots and strict authentication variants. Legacy
experimental fields such as chain, protected, database, deploy, verify, purge,
rollback, notifications and promote hooks are rejected rather than aliased.
There is no independent authored promote.version. Runtime semantic checks
(graph references, inheritance, normalized paths, expansion limits and
case-insensitive header uniqueness) remain azd-promote responsibilities.

Newer stable commit `8c23c31c74f01ff3ef3e466ba505bb4f65604e0d` adds
imagePassthrough and host/evaluation changes; these are deferred. Alpha-only
root layers, deploymentStacks and infra closure changes are not adopted.
Stable infra.layers is included and is not alpha-only.

### Maintenance, migration and publication

Existing v1.2 URI consumers receive this intentional contract change on
publication. Migrate legacy promote configuration to #167's strict contract
before adopting the updated schema. For reproducible consumption replace main
with an approved publication commit and pin the complete resource graph.

`pnpm generate-schema-v12 --download` explicitly retrieves pinned sources
through GitHub API. Ordinary generation and `pnpm check-schema-v12` are offline.
`pnpm test-schema-v12` and `pnpm validate-schema --offline` use real registered
resources, not permissive placeholders. Unknown references fail closed.

The complete served graph comprises azure.yaml.json, legacy-app.schema.json,
promote.schema.json and vendor/**. Copying the aggregate alone is insufficient.
Retrieval and hash verification of the approved published graph is a separate
post-publication gate; local tests do not prove public availability.

## Previous v1.2 contract

The original centralized v1.2 schema preserved the v1.1 app extension additions
and introduced the experimental phase-oriented promote model. That historical
schema is available at commit `b73e7824d8c010be1760d60cf6ee8ac1b0856b73`,
Git blob `28b4cda1a8e0ede0895a87f17e27b8476fb5d9d5`. Its promote acceptance
and Draft-07 dialect are intentionally superseded by this reconciliation.
The upstream v1.0 and azd-app v1.1 schema files remain unchanged.
