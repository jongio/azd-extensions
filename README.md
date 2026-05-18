<div align="center">
  <img src="public/logo.png" alt="azd extensions" width="200" height="100">
  <h1>azd extensions</h1>
  <p><strong>A curated registry of Azure Developer CLI extensions</strong></p>
</div>

<div align="center">

[![Publish](https://github.com/jongio/azd-extensions/actions/workflows/publish.yml/badge.svg)](https://github.com/jongio/azd-extensions/actions/workflows/publish.yml)
[![CI](https://github.com/jongio/azd-extensions/actions/workflows/ci.yml/badge.svg)](https://github.com/jongio/azd-extensions/actions/workflows/ci.yml)

</div>

<br />

🌐 **Live Site**: [jongio.github.io/azd-extensions](https://jongio.github.io/azd-extensions/)

## Extensions

| Extension | Description | Latest | Website |
|-----------|-------------|--------|---------|
| [**azd-app**](https://github.com/jongio/azd-app) | Run Azure apps locally with auto-dependencies, real-time dashboard, and AI-powered debugging via MCP | v0.14.0 | [🌐](https://jongio.github.io/azd-app/) |
| [**azd-copilot**](https://github.com/jongio/azd-copilot) | AI-powered Azure development with 16 agents, 29 Azure skills, and MCP server integration | v0.2.3 | [🌐](https://jongio.github.io/azd-copilot/) |
| [**azd-rest**](https://github.com/jongio/azd-rest) | Make authenticated REST API calls to Azure with automatic scope detection and token management | v0.4.6 | [🌐](https://jongio.github.io/azd-rest/) |

> **Note:** `azd exec` has moved to core Azure Developer CLI as `microsoft.azd.exec`. See [azure/azure-dev#7400](https://github.com/Azure/azure-dev/pull/7400).

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
azd extension install jongio.azd.app jongio.azd.copilot jongio.azd.rest

# Or install individually
azd extension install jongio.azd.app
azd extension install jongio.azd.copilot
azd extension install jongio.azd.rest

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

### azd-rest

Make authenticated REST API calls to any Azure service — automatic OAuth scope detection, token management, and MCP server for AI integration:

```bash
# GET request to Azure Resource Manager
azd rest get "https://management.azure.com/subscriptions?api-version=2022-12-01"

# POST with a JSON body
azd rest post "https://management.azure.com/..." --body '{"key": "value"}'

# Use any HTTP method
azd rest put "https://..." --body @payload.json
azd rest patch "https://..." --body '{"update": true}'
azd rest delete "https://..."
azd rest head "https://..."

# Start the MCP server for AI-powered Azure API exploration
azd rest mcp serve
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
| `pnpm preview` | Preview production build |
| `pnpm validate-registry` | Validate registry URLs and structure |
| `pnpm update-readme-versions` | Update README version table |

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Astro 6 + TypeScript |
| Styling | Tailwind CSS 4 |
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
│   ├── components/     # Astro components (ExtensionShowcase, etc.)
│   ├── pages/          # Astro pages
│   └── styles/         # Global styles
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
  <sub>Built by <a href="https://github.com/jongio">Jon Gallant</a> with Astro 6 and Tailwind CSS 4</sub>
</div>
