# azure.yaml Schema Changelog

## v1.2 (azd-extensions)

**Schema location**: `azd-extensions/schemas/v1.2/azure.yaml.json`
**$id**: `https://raw.githubusercontent.com/jongio/azd-extensions/main/schemas/v1.2/azure.yaml.json`

### Summary

v1.2 is a **superset of v1.1** (which is itself a superset of v1.0). All existing properties from v1.0 and v1.1 are fully preserved. Starting with v1.2, the schema lives in the `azd-extensions` repo as the centralized home for all azd extension schema additions.

### New

- **`promote`** top-level property configures the `azd promote` extension with a strict config-first contract.
- The stale pre-release promote model has been replaced completely. Legacy phase-specific fields and permissive environment overrides are rejected.
- The authored `promote` object has no independent `version`. The v1.2 `azure.yaml` schema URI is the sole public contract version.
- Promote-owned keys and identifiers use lower camelCase. Real azd environment names, file paths, Git refs, lock names, external resource names, CLI flags, and environment variables retain their native conventions.
- The contract covers projects, named chains, real environments, operations, artifacts, providers, reusable lifecycle hooks, candidate policy, approvals, results, run records, snapshots, authentication, locks, previous-run files, live files, and provider variables and secrets.
- Public terminology uses run records, previous runs, verification, results, cleanup, changes, and inspection.

### Pre-release compatibility

The replacement promote contract is not compatible with the stale experimental model. Runtime implementations, CLI and MCP adapters, durable-state formats, documentation, examples, and downstream configurations must adopt the final contract before claiming v1.2 compatibility.

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

| Version  | Repository         | Path                               |
| -------- | ------------------ | ---------------------------------- |
| v1.0     | azure-dev          | Built-in to azd CLI                |
| v1.1     | azd-app            | `schemas/v1.1/azure.yaml.json`     |
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

Existing v1.0 and v1.1 properties remain compatible. Configurations that used the unreleased experimental `promote` model must migrate to the replacement contract before release.
