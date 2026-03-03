# AZD Extensions - Copilot Instructions

## Release Orchestration

This repository is the **registry hub** for all azd extensions. When performing
cross-repo releases, sweeping changes, or coordinated updates across the azd
extension ecosystem:

1. **Read `release.yaml`** at the repository root FIRST. It defines the complete
   dependency graph, release tiers, per-repo procedures, and post-release
   verification steps.

2. **Follow tier order strictly**: Tier 0 (azd-core, azd-web-core) MUST be
   released before Tier 1 (azd-app, azd-copilot, azd-exec, azd-rest,
   azd-extensions). Tier 0 repos can be parallel. Tier 1 repos can be parallel
   after Tier 0 completes.

3. **Dependency updates**: After releasing Tier 0, Tier 1 repos must update
   their references:
   - Go modules: `go get github.com/jongio/azd-core@v{new}` in `cli/` directory
   - npm packages: Update `@jongio/azd-web-core` version in `package.json` / `web/package.json`

4. **Testing**: Use `GOWORK=off` when testing Go repos independently (a
   go.work file at parent level may reference paths that don't exist on all
   machines).

5. **Post-release verification**: After all releases complete, follow the
   `post_release_verification` section in release.yaml to confirm the registry
   is updated and `azd extension upgrade --all` resolves the correct versions.

6. **Registry update flow**: Each extension's release workflow sends a
   `repository_dispatch` to this repo, triggering `publish.yml`. That workflow
   runs `scripts/update-registry.js` to aggregate each extension repo's
   `registry.json` into `public/registry.json` and deploys to GitHub Pages.

## Per-Repo Test Commands

| Repo | Test Command |
|------|-------------|
| azd-core | `GOWORK=off go test ./...` |
| azd-web-core | `npm run check && npm run lint` |
| azd-app | `cd cli && GOWORK=off go test ./...` |
| azd-copilot | `cd cli && GOWORK=off go test ./...` |
| azd-exec | `cd cli && GOWORK=off go test ./...` |
| azd-rest | `cd cli && GOWORK=off go test ./...` |
| azd-extensions | `pnpm run build` |

## Excluded Repos

- `azd-app-2`: Secondary clone for parallel work; not a release target
- `docs`: Documentation only, no release artifacts
