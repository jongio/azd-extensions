<div align="center">
  <img src="public/logo.png" alt="Jon Gallant" width="200" height="100">
  <h1>azd extensions by Jon Gallant</h1>
</div>

<div align="center">

[![Deploy to GitHub Pages](https://github.com/jongio/azd-extensions/actions/workflows/deploy.yml/badge.svg)](https://github.com/jongio/azd-extensions/actions/workflows/deploy.yml)
[![Update Registry](https://github.com/jongio/azd-extensions/actions/workflows/update-registry.yml/badge.svg)](https://github.com/jongio/azd-extensions/actions/workflows/update-registry.yml)
[![CI](https://github.com/jongio/azd-extensions/actions/workflows/ci.yml/badge.svg)](https://github.com/jongio/azd-extensions/actions/workflows/ci.yml)
[![CodeQL](https://github.com/jongio/azd-extensions/actions/workflows/codeql.yml/badge.svg)](https://github.com/jongio/azd-extensions/actions/workflows/codeql.yml)
[![codecov](https://codecov.io/gh/jongio/azd-extensions/branch/main/graph/badge.svg)](https://codecov.io/gh/jongio/azd-extensions)

</div>

A centralized registry and showcase website for Azure Developer CLI (azd) extensions created by Jon Gallant.

🌐 **Live Site**: [https://jongio.github.io/azd-extensions/](https://jongio.github.io/azd-extensions/)

## About

This repository serves as a central registry for all azd extensions I create. The site provides:

- 📦 A centralized `registry.json` for easy installation of all extensions
- 🎨 A modern, responsive website showcasing each extension
- 📚 Clear installation instructions and usage examples
- 🔍 Extension search and filtering capabilities

## Tech Stack

- **React 19** - Latest React with improved performance
- **TypeScript** - Type-safe development
- **Vite** - Fast build tooling
- **Tailwind CSS 4** - Modern utility-first CSS
- **shadcn/ui** - Beautiful, accessible components
- **Vitest** - Fast unit testing
- **GitHub Actions** - CI/CD pipeline

## Getting Started

### Prerequisites

- Node.js 20 or later
- pnpm 9 or later

### Installation

```bash
# Clone the repository
git clone https://github.com/jongio/azd-extensions.git
cd azd-extensions

# Install dependencies
pnpm install

# Start development server
pnpm run dev
```

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm preview          # Preview production build

# Testing
pnpm test                 # Run tests
pnpm test:watch           # Run tests in watch mode
pnpm test:coverage        # Generate coverage report

# Code Quality
pnpm lint             # Lint code
pnpm lint:fix         # Fix lint issues
pnpm type-check       # Type check TypeScript
pnpm format           # Format code with Prettier
pnpm format:check     # Check code formatting
```

## Using the Extension Registry

### Step 1: Enable Extensions (Alpha Feature)

Azure Developer CLI extensions are currently an alpha feature. Enable them with:

```bash
azd config set alpha.extensions on
```

### Step 2: Add This Registry

Add this registry as an extension source:

```bash
azd extension source add -n jongio -t url -l "https://jongio.github.io/azd-extensions/registry.json"
```

### Step 3: Browse and Install Extensions

List available extensions:

```bash
azd extension list --source jongio
```

Install an extension:

```bash
azd extension install <extension-id>
```

View installed extensions:

```bash
azd extension list --installed
```

## Registry Schema

The `registry.json` file follows the [official azd extension registry schema](https://raw.githubusercontent.com/Azure/azure-dev/refs/heads/main/cli/azd/extensions/registry.schema.json).

Example structure:

```json
{
  "$schema": "https://raw.githubusercontent.com/Azure/azure-dev/refs/heads/main/cli/azd/extensions/registry.schema.json",
  "extensions": [
    {
      "id": "example.extension",
      "displayName": "Example Extension",
      "description": "An example azd extension",
      "version": "1.0.0",
      "namespace": "example",
      "tags": ["demo", "example"],
      "capabilities": ["custom-commands"],
      "repository": "https://github.com/user/extension",
      "releases": [
        {
          "version": "1.0.0",
          "url": "https://github.com/user/extension/releases/download/v1.0.0/extension.zip",
          "checksum": "sha256:...",
          "publishedAt": "2024-01-01T00:00:00Z"
        }
      ]
    }
  ]
}
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests (`pnpm test`)
5. Run linting (`pnpm lint`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Quality Standards

This project maintains high code quality standards:

- ✅ All tests must pass
- ✅ Code coverage should remain above 80%
- ✅ No linting errors
- ✅ TypeScript strict mode
- ✅ Formatted with Prettier
- ✅ Spell checked

## Maintaining the Registry

### Automatic Updates

The registry is automatically updated daily by the `update-registry.yml` workflow. This workflow:

1. Checks each extension repository for new releases
2. Updates version numbers, release URLs, and checksums
3. Creates a pull request with the changes
4. Keeps up to 5 most recent releases for each extension

### Manual Updates

You can manually trigger a registry update:

```bash
# Via GitHub CLI
gh workflow run update-registry.yml

# Or run the script locally
export GITHUB_TOKEN=your_token_here
node scripts/update-registry.js
```

### Adding New Extensions

To add a new extension to the registry:

1. Add the extension entry to `registry.json`
2. Update the `EXTENSIONS` array in `scripts/update-registry.js`
3. The workflow will automatically maintain it going forward

## GitHub Actions Workflows

### CI Pipeline (`ci.yml`)

Runs on every push and pull request:

- Linting and formatting checks
- TypeScript type checking
- Unit tests with coverage
- Build verification

### CodeQL Analysis (`codeql.yml`)

Security scanning:

- Runs weekly and on PRs
- Identifies security vulnerabilities
- Analyzes JavaScript/TypeScript code

### Spell Check (`spellcheck.yml`)

Content quality:

- Checks spelling in all files
- Runs on push and PRs

### Deployment (`deploy.yml`)

Automatic deployment to GitHub Pages:

- Builds the site
- Deploys to GitHub Pages
- Runs on main branch pushes

### Registry Update (`update-registry.yml`)

Automatic registry maintenance:

- Runs daily at 2 AM UTC (or on manual trigger)
- Fetches latest releases from all extension repositories
- Updates `registry.json` with new versions, URLs, and checksums
- Creates a PR with the changes for review
- Keeps the registry synchronized with extension releases

## Project Structure

```
azd-extensions/
├── .github/
│   └── workflows/          # GitHub Actions workflows
├── src/
│   ├── components/         # React components
│   │   ├── ui/            # shadcn/ui components
│   │   ├── AlphaNotice.tsx
│   │   ├── ExtensionCard.tsx
│   │   ├── Footer.tsx
│   │   └── Header.tsx
│   ├── lib/               # Utility functions
│   ├── test/              # Test setup
│   ├── types/             # TypeScript types
│   ├── App.tsx            # Main app component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── registry.json          # Extension registry
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Testing

This project uses Vitest for testing with comprehensive coverage:

```bash
# Run all tests
pnpm test

# Watch mode for development
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

Coverage reports are automatically uploaded to [Codecov](https://codecov.io/gh/jongio/azd-extensions) on CI runs.

## License

MIT License - see [LICENSE](LICENSE) file for details

## Resources

- [Azure Developer CLI Documentation](https://learn.microsoft.com/azure/developer/azure-developer-cli/overview)
- [azd Extension Framework](https://github.com/Azure/azure-dev/blob/main/cli/azd/docs/extension-framework.md)
- [Extension Services Documentation](https://github.com/Azure/azure-dev/blob/main/cli/azd/docs/extension-framework-services.md)

## Author

**Jon Gallant**

- GitHub: [@jongio](https://github.com/jongio)
- Website: [jongallant.com](https://jongallant.com)

## Support

For questions or issues:

- Open an [issue](https://github.com/jongio/azd-extensions/issues)
- Check the [azd documentation](https://learn.microsoft.com/azure/developer/azure-developer-cli/)

---

Built with ❤️ using React 19, Vite, TypeScript, Tailwind CSS 4, and shadcn/ui
