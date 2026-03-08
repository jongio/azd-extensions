# azure.yaml Schema Changelog

## v1.2 (azd-extensions)

**Schema location**: `azd-extensions/schemas/v1.2/azure.yaml.json`
**$id**: `https://raw.githubusercontent.com/jongio/azd-extensions/main/schemas/v1.2/azure.yaml.json`

### Summary

v1.2 is a **superset of v1.1** (which is itself a superset of v1.0). All existing properties from v1.0 and v1.1 are fully preserved. Starting with v1.2, the schema lives in the `azd-extensions` repo as the centralized home for all azd extension schema additions.

### New

- **`promote`** top-level property — Configures the `azd promote` extension for orchestrating environment promotion pipelines. Sub-properties:
  - `chain` — Ordered list of environment names forming the promotion chain (e.g., `[dev, staging, prod]`).
  - `protected` — Environments that require explicit confirmation before promotion.
  - `database` — Database configuration for backup and migration phases, including:
    - `connection_string.env_var` — Environment variable for the DB connection string.
    - `backup.retain` — Number of backup copies to retain (default: 5).
    - `migrate` — Single command or multi-step migration pipeline with optional interactive confirmation.
    - `seed` — Database seeding command.
  - `deploy` — Deploy phase configuration (service filtering).
  - `verify` — Post-deploy verification with health check endpoints and smoke test commands.
  - `hooks` — User-defined `pre-`/`post-` commands for each promotion phase (preflight, backup, migrate, provision, deploy, verify).
  - `confirm` — Custom typed-confirmation gate before proceeding.
  - `environments` — Per-environment overrides that deep-merge onto the base promote config.

### Preserved from v1.1

All v1.1 properties added by the `azd app` extension remain unchanged:

- `services[].run`, `services[].dependencies`, `services[].readyPattern`, `services[].env`, `services[].preRestore`, `services[].port`, `services[].urlPath`, `services[].healthCheck`
- `resources` (external resource definitions for local development)
- `reqs` (prerequisite tool requirements)
- `logs` (project-level logging configuration)
- `test` (global test configuration)
- All associated definitions (service, resource, requirement, logsConfig, testConfig, etc.)

### Preserved from v1.0

All core azd properties remain unchanged:

- `name`, `resourceGroup`, `metadata`, `infra`, `services` (core), `pipeline`, `hooks`, `requiredVersions`, `state`, `platform`, `workflows`, `cloud`

### Schema Location Change

| Version | Repository | Path |
|---------|-----------|------|
| v1.0 | azure-dev | Built-in to azd CLI |
| v1.1 | azd-app | `schemas/v1.1/azure.yaml.json` |
| **v1.2** | **azd-extensions** | **`schemas/v1.2/azure.yaml.json`** |

Starting with v1.2, the `azd-extensions` repo is the centralized schema home. The v1.1 schema in `azd-app` remains frozen for backward compatibility.

### Migration Guide

To adopt the v1.2 schema in your `azure.yaml`, update the `$schema` reference:

```yaml
# Before (v1.1)
# yaml-language-server: $schema=https://raw.githubusercontent.com/jongio/azd-app/main/schemas/v1.1/azure.yaml.json

# After (v1.2)
# yaml-language-server: $schema=https://raw.githubusercontent.com/jongio/azd-extensions/main/schemas/v1.2/azure.yaml.json
```

No other changes are required — v1.2 is fully backward compatible with v1.1 and v1.0 configurations. The new `promote` property is optional.
