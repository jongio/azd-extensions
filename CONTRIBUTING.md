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
| `pnpm test` | Run tests |
| `pnpm test:watch` | Watch mode |
| `pnpm test:coverage` | Coverage report |
| `pnpm lint` | Lint code |
| `pnpm lint:fix` | Fix lint issues |
| `pnpm type-check` | TypeScript check |
| `pnpm format` | Format with Prettier |
| `pnpm format:check` | Check formatting |

## Pull Request Process

1. Fork and create branch from `main`
2. Make changes following coding standards
3. Add tests for new functionality
4. Ensure all checks pass:
   ```bash
   pnpm lint && pnpm type-check && pnpm test
   ```
5. Submit PR

### Quality Standards

- ✅ All tests pass
- ✅ Coverage ≥80%
- ✅ No lint errors
- ✅ TypeScript strict mode
- ✅ Formatted with Prettier

## Coding Standards

### TypeScript
- Strict mode enabled
- No `any` types
- Proper type definitions

### React
- Functional components with hooks
- Small, focused components
- Custom hooks for reusable logic

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
test: add tests
refactor: code improvement
chore: maintenance
```

## Registry Maintenance

### Automatic Updates

The registry auto-updates daily via `update-registry.yml`:
1. Fetches latest releases from extension repos
2. Updates versions, URLs, and checksums
3. Creates PR for review

### Manual Update

```bash
gh workflow run update-registry.yml

# Or locally
export GITHUB_TOKEN=your_token
node scripts/update-registry.js
```

### Adding New Extensions

1. Add entry to `public/registry.json`:
   ```json
   {
     "id": "author.azd.extension-name",
     "namespace": "extension-name",
     "displayName": "Extension Name",
     "description": "What it does",
     "versions": [...]
   }
   ```
2. Update `scripts/update-registry.js` with the repo
3. Workflow maintains it automatically

## CI/CD Workflows

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `ci.yml` | Push/PR | Lint, type-check, test, build |
| `deploy.yml` | Push to main | Deploy to GitHub Pages |
| `update-registry.yml` | Daily / Manual | Sync extension releases |
| `codeql.yml` | Weekly / PR | Security scanning |
| `spellcheck.yml` | Push/PR | Spell checking |
| `dependency-review.yml` | PR | Dependency vulnerability check |

## Project Structure

```
├── src/
│   ├── components/        # React components
│   │   ├── ui/           # shadcn/ui components
│   │   └── icons/        # Custom icons
│   ├── lib/              # Utility functions
│   ├── test/             # Test setup
│   ├── types/            # TypeScript types
│   ├── App.tsx           # Main app
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
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
