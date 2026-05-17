# Contributing to azd Extensions

Thank you for your interest in contributing!

## Quick Start

```bash
git clone https://github.com/YOUR-USERNAME/azd-extensions.git
cd azd-extensions
pnpm install
pnpm dev
```

### Prerequisites

- Node.js 20+
- pnpm 9+

## Development Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |
| `pnpm test` | Run tests (vitest) |
| `pnpm validate-registry` | Validate registry.json |
| `pnpm update-readme-versions` | Update README version table |

## Pull Request Process

1. Fork and create branch from `main`
2. Make changes following coding standards
3. Add tests for new functionality
4. Ensure the build passes:
   ```bash
   pnpm build
   ```
5. Submit PR

### Quality Standards

- ✅ Build passes (`pnpm build`)
- ✅ TypeScript strict mode
- ✅ Clean, readable code

## Coding Standards

### TypeScript
- Strict mode enabled
- No `any` types
- Proper type definitions

### Astro Components
- `.astro` components in `src/components/`
- Props interface defined at the top
- Small, focused components

### Styling
- Tailwind CSS utilities
- Responsive design
- Semantic HTML

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: resolve bug
docs: update documentation
refactor: code improvement
chore: maintenance
```

## Registry Maintenance

### Automatic Updates

The registry auto-updates daily via `publish.yml`:
1. Fetches latest `registry.json` from each extension repo
2. Aggregates them into `public/registry.json`
3. Commits changes and deploys to GitHub Pages

Extensions can also trigger an immediate update by sending a `repository_dispatch` event (see [Adding a New Extension](#adding-a-new-extension)).

### Manual Update

```bash
# Trigger via GitHub CLI
gh workflow run publish.yml

# Or run locally
node scripts/update-registry.js
```

---

## Adding a New Extension

This is the complete checklist for adding a new azd extension to this registry. Each extension lives in its own repo (e.g., `jongio/azd-myext`) and publishes its own `registry.json`. This repo aggregates them all.

### 1. Create `registry.json` in the Extension Repo

Your extension repo must have a `registry.json` at its root. This is the source of truth for your extension's metadata, versions, and download URLs. It gets generated/updated by `azd x publish` during your release workflow.

Example structure:
```json
{
  "extensions": [
    {
      "id": "jongio.azd.myext",
      "namespace": "myext",
      "displayName": "My Extension",
      "description": "What it does",
      "versions": [
        {
          "version": "0.1.0",
          "capabilities": ["custom-commands"],
          "usage": "azd myext <command>",
          "artifacts": {
            "darwin/amd64": { "url": "...", "checksum": { "algorithm": "sha256", "value": "..." }, "entryPoint": "..." },
            "darwin/arm64": { "url": "...", "checksum": { "algorithm": "sha256", "value": "..." }, "entryPoint": "..." },
            "linux/amd64":  { "url": "...", "checksum": { "algorithm": "sha256", "value": "..." }, "entryPoint": "..." },
            "linux/arm64":  { "url": "...", "checksum": { "algorithm": "sha256", "value": "..." }, "entryPoint": "..." },
            "windows/amd64": { "url": "...", "checksum": { "algorithm": "sha256", "value": "..." }, "entryPoint": "..." },
            "windows/arm64": { "url": "...", "checksum": { "algorithm": "sha256", "value": "..." }, "entryPoint": "..." }
          }
        }
      ],
      "tags": ["relevant", "tags"]
    }
  ]
}
```

The `azd x publish` command in your release workflow will generate and update this file automatically.

### 2. Add Source URL to `scripts/update-registry.js`

Add your extension's raw `registry.json` URL to the `EXTENSION_SOURCES` array:

```js
const EXTENSION_SOURCES = [
  'https://raw.githubusercontent.com/jongio/azd-exec/refs/heads/main/registry.json',
  'https://raw.githubusercontent.com/jongio/azd-app/refs/heads/main/registry.json',
  'https://raw.githubusercontent.com/jongio/azd-copilot/refs/heads/main/registry.json',
  // Add your extension here:
  'https://raw.githubusercontent.com/jongio/azd-myext/refs/heads/main/registry.json',
];
```

### 3. Add Dispatch Notification to Your Release Workflow

Your extension's `release.yml` should notify `azd-extensions` after a successful release so the registry updates immediately (instead of waiting for the daily cron). Add this step at the end of your release job:

```yaml
    - name: Notify azd-extensions
      if: success()
      run: |
        curl -X POST \
          -H "Accept: application/vnd.github.v3+json" \
          -H "Authorization: token ${{ secrets.EXTENSIONS_DISPATCH_TOKEN }}" \
          https://api.github.com/repos/jongio/azd-extensions/dispatches \
          -d '{"event_type":"extension-released","client_payload":{"repo":"azd-myext","version":"${{ steps.version.outputs.next }}"}}'
```

### 4. Create the `EXTENSIONS_DISPATCH_TOKEN` Secret

The dispatch step requires a Personal Access Token (PAT) with permission to trigger workflows on the `azd-extensions` repo.

1. Go to [GitHub Settings > Developer settings > Personal access tokens > Fine-grained tokens](https://github.com/settings/tokens?type=beta)
2. Create a new token with:
   - **Repository access**: Select `jongio/azd-extensions`
   - **Permissions**: Contents (read/write) — needed for `repository_dispatch`
3. Go to your extension repo's **Settings > Secrets and variables > Actions**
4. Add a new repository secret named `EXTENSIONS_DISPATCH_TOKEN` with the PAT value

> **Note**: All extension repos that dispatch to azd-extensions need this same secret. If you're adding a new extension, you may need to update the PAT's repository access to include the new extension repo, or create a dedicated token.

### 5. Add to Developer Helper Scripts

Update the local development scripts in `scripts/` so other developers can build and watch your extension alongside the others.

**`scripts/install-all.ps1`** — Add your extension to the `$extensions` array:
```powershell
$extensions = @(
    @{ Name = "azd-exec";    Id = "jongio.azd.exec";    Path = Join-Path $parentDir "azd-exec\cli" },
    @{ Name = "azd-app";     Id = "jongio.azd.app";     Path = Join-Path $parentDir "azd-app\cli" },
    @{ Name = "azd-copilot"; Id = "jongio.azd.copilot"; Path = Join-Path $parentDir "azd-copilot\cli" },
    # Add your extension:
    @{ Name = "azd-myext";   Id = "jongio.azd.myext";   Path = Join-Path $parentDir "azd-myext\cli" }
)
```

**`scripts/watch-all.ps1`** — Add your extension to the `$extensions` array:
```powershell
$extensions = @(
    @{ Name = "exec";    Color = "Cyan";    Path = Join-Path $parentDir "azd-exec\cli" },
    @{ Name = "app";     Color = "Green";   Path = Join-Path $parentDir "azd-app\cli" },
    @{ Name = "copilot"; Color = "Magenta"; Path = Join-Path $parentDir "azd-copilot\cli" },
    # Add your extension:
    @{ Name = "myext";   Color = "Yellow";  Path = Join-Path $parentDir "azd-myext\cli" }
)
```

### 6. Add UI Card Data

Add your extension's display data to the extension showcase in `src/components/ExtensionShowcase.astro` or the relevant data file in `src/data/`.

### 7. Test the Full Flow

1. **Local registry update**: Run `node scripts/update-registry.js` to verify your extension is fetched and merged
2. **Local dev build**: Run `pnpm dev` and verify the extension card renders correctly
3. **Local install**: Run `pwsh scripts/install-all.ps1` to verify the extension builds locally
4. **Submit PR**: Open a PR to `main` with your changes - CI will validate the build
5. **After merge**: The publish workflow deploys to GitHub Pages and the registry goes live

### Summary Checklist

| Step | Where | What |
|------|-------|------|
| 1 | Extension repo | Create/update `registry.json` (via `azd x publish`) |
| 2 | azd-extensions | Add URL to `scripts/update-registry.js` |
| 3 | Extension repo | Add dispatch step to `release.yml` |
| 4 | GitHub Settings | Create PAT and add `EXTENSIONS_DISPATCH_TOKEN` secret |
| 5 | azd-extensions | Add to `scripts/install-all.ps1` and `scripts/watch-all.ps1` |
| 6 | azd-extensions | Add card data in `ExtensionShowcase.astro` or `src/data/` |
| 7 | Both repos | Test registry update, dev build, and local install |

## CI/CD Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR | Build and validate |
| `publish.yml` | Daily / Manual / Dispatch | Update registry, build, deploy to GitHub Pages |
| `codeql.yml` | Weekly / PR | Security scanning |
| `spellcheck.yml` | Push/PR | Spell checking |
| `dependency-review.yml` | PR | Dependency vulnerability check |

## Project Structure

```
├── src/
│   ├── components/        # Astro components
│   ├── data/             # Data files
│   ├── pages/            # Astro pages
│   ├── styles/           # Global styles
│   └── types/            # TypeScript types
├── public/
│   └── registry.json     # Extension registry
├── scripts/
│   └── update-registry.js
└── .github/workflows/    # CI/CD
```

## Reporting Issues

Include:
- Clear title
- Steps to reproduce
- Expected vs actual behavior
- Environment (OS, Node version)
- Screenshots if applicable

## Questions?

- Open an issue
- Check existing issues/PRs
- Review [azd documentation](https://learn.microsoft.com/azure/developer/azure-developer-cli/)

Thanks for contributing! 🎉
