# Quick Start Guide

Get the azd extensions registry website running in less than 5 minutes!

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or later
- [pnpm](https://pnpm.io/) 9 or later
- [Git](https://git-scm.com/)

## 1. Clone the Repository

```bash
git clone https://github.com/jongio/azd-extensions.git
cd azd-extensions
```

## 2. Install Dependencies

```bash
pnpm install
```

This will install all required packages including React 19, Vite, TypeScript, Tailwind CSS 4, and testing tools.

## 3. Start Development Server

```bash
pnpm dev
```

The site will be available at `http://localhost:5173`

## 4. Explore the Site

- View the extension cards (currently empty - add your extensions to registry.json)
- Check the responsive design on different screen sizes
- Read the alpha feature notice
- Review the getting started instructions

## 5. Run Tests

```bash
# Run all tests once
pnpm test

# Run tests in watch mode (recommended during development)
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

## 6. Build for Production

```bash
pnpm build
```

The production build will be in the `dist` folder.

## 7. Preview Production Build

```bash
pnpm preview
```

## Common Development Commands

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Fix lint issues
pnpm lint:fix

# Format code
pnpm format

# Check formatting
pnpm format:check
```

## Adding Your First Extension

Edit `registry.json`:

```json
{
  "$schema": "https://raw.githubusercontent.com/Azure/azure-dev/refs/heads/main/cli/azd/extensions/registry.schema.json",
  "extensions": [
    {
      "id": "your.extension.id",
      "displayName": "Your Extension Name",
      "description": "Description of your extension",
      "version": "1.0.0",
      "namespace": "yournamespace",
      "tags": ["tag1", "tag2"],
      "repository": "https://github.com/yourusername/your-extension"
    }
  ]
}
```

Save and refresh the browser - your extension will appear!

## Deployment to GitHub Pages

1. Push your code to GitHub:

   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. Enable GitHub Pages:
   - Go to repository Settings > Pages
   - Set source to "GitHub Actions"

3. The deploy workflow will run automatically and deploy your site!

## Troubleshooting

### Port Already in Use

If port 5173 is already in use, Vite will automatically use the next available port.

### Module Not Found

Make sure all dependencies are installed:

```bash
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Tests Failing

Ensure you're using Node.js 20 or later:

```bash
node --version
```

### Build Errors

Clear the build cache:

```bash
rm -rf dist
pnpm build
```

## Need Help?

- Check the [README.md](README.md) for detailed documentation
- Review [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines
- Open an [issue](https://github.com/jongio/azd-extensions/issues) if you find a bug

Happy coding! 🚀
