<div align="center">
  <img src="public/logo.png" alt="azd extensions" width="200" height="100">
  <h1>azd extensions</h1>
  <p><strong>A curated registry of Azure Developer CLI extensions</strong></p>
</div>

<div align="center">

[![Publish](https://github.com/jongio/azd-extensions/actions/workflows/publish.yml/badge.svg)](https://github.com/jongio/azd-extensions/actions/workflows/publish.yml)
[![CI](https://github.com/jongio/azd-extensions/actions/workflows/ci.yml/badge.svg)](https://github.com/jongio/azd-extensions/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/jongio/azd-extensions/branch/main/graph/badge.svg)](https://codecov.io/gh/jongio/azd-extensions)

</div>

<br />

🌐 **Live Site**: [jongio.github.io/azd-extensions](https://jongio.github.io/azd-extensions/)

## Extensions

| Extension | Description | Latest |
|-----------|-------------|--------|
| [**azd-app**](https://github.com/jongio/azd-app) | Run Azure apps locally with auto-dependencies, real-time dashboard, and AI-powered debugging via MCP | v0.12.0 |
| [**azd-copilot**](https://github.com/jongio/azd-copilot) | AI-powered Azure development with 16 agents, 29 Azure skills, and MCP server integration | v0.1.4 |
| [**azd-exec**](https://github.com/jongio/azd-exec) | Execute scripts with azd environment context, Azure credentials, and Key Vault integration | v0.3.3 |

## Quick Start

### 1. Add This Registry

```bash
azd extension source add -n jongio -t url -l "https://jongio.github.io/azd-extensions/registry.json"
```

### 2. Install Extensions

```bash
# List available extensions
azd extension list --source jongio

# Install all extensions
azd extension install jongio.azd.app jongio.azd.copilot jongio.azd.exec

# Or install individually
azd extension install jongio.azd.app
azd extension install jongio.azd.copilot
azd extension install jongio.azd.exec

# View installed
azd extension list --installed
```

## Usage Examples

### azd-app

Run your entire app locally with one command — auto-dependencies, real-time dashboard, and AI-powered debugging:

```bash
# Start all services defined in azure.yaml
azd app run

# Check prerequisites are installed
azd app reqs

# Install dependencies for all services
azd app deps

# View logs (with optional follow)
azd app logs --follow

# Monitor service health
azd app health --stream

# Run tests with coverage
azd app test --coverage

# Show project info
azd app info

# Start the MCP server for AI debugging with GitHub Copilot
azd app mcp serve
```

### azd-copilot

AI-powered Azure development assistant with agents, skills, and MCP server:

```bash
# Start the MCP server for GitHub Copilot integration
azd copilot mcp serve

# Use Azure agents for architecture, development, deployment, and more
azd copilot agent list
```

### azd-exec

Run any script with full access to your azd environment variables, Azure credentials, and Key Vault secrets:

```bash
# Execute a script file with azd context
azd exec ./deploy.sh

# Execute an inline command
azd exec 'echo "Deploying to $AZURE_ENV_NAME"'

# Specify shell explicitly
azd exec --shell pwsh ./deploy.ps1

# Run in interactive mode
azd exec --interactive ./setup.sh

# Pass arguments to a script
azd exec ./build.sh --verbose --config release

# Key Vault secrets are resolved automatically from azd env references
azd exec ./deploy-with-secrets.sh
```

## Development

### Prerequisites

- Node.js 20+
- pnpm 9+

### Setup

```bash
git clone https://github.com/jongio/azd-extensions.git
cd azd-extensions
pnpm install
pnpm dev
```

### Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm build` | Build for production |
| `pnpm test` | Run tests |
| `pnpm test:coverage` | Generate coverage report |
| `pnpm lint` | Lint code |
| `pnpm type-check` | TypeScript check |
| `pnpm format` | Format with Prettier |

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 19 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Animation | Motion |
| Testing | Vitest |
| CI/CD | GitHub Actions |

## Registry

The `public/registry.json` file is the extension source that azd reads. It auto-updates daily via GitHub Actions.

### Manual Update

```bash
gh workflow run update-registry.yml
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for details on adding extensions.

## Project Structure

```
├── src/
│   ├── components/     # React components (Header, Footer, ExtensionCard, etc.)
│   │   ├── ui/        # shadcn/ui components
│   │   └── icons/     # Custom icons
│   ├── lib/           # Utilities
│   └── types/         # TypeScript types
├── public/
│   └── registry.json  # Extension registry (served to azd)
└── scripts/
    ├── update-registry.js    # Aggregates extension registries
    └── validate-registry.js  # Validates registry URLs and structure
```

## Resources

- [Azure Developer CLI Documentation](https://learn.microsoft.com/azure/developer/azure-developer-cli/)
- [azd Extension Framework](https://github.com/Azure/azure-dev/blob/main/cli/azd/docs/extension-framework.md)
- [Contributing Guide](CONTRIBUTING.md)

## License

MIT — see [LICENSE](LICENSE)

---

<div align="center">
  <sub>Built by <a href="https://github.com/jongio">Jon Gallant</a> with React 19, Vite 7, and Tailwind CSS 4</sub>
</div>
