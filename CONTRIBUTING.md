# Contributing to azd Extensions

Thank you for your interest in contributing to this project! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our code of conduct which promotes a respectful and inclusive community.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Your environment (OS, Node version, etc.)

### Suggesting Enhancements

Enhancement suggestions are welcome! Please create an issue with:

- A clear, descriptive title
- Detailed description of the proposed feature
- Rationale for why this would be useful
- Any relevant examples or mockups

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Add tests** for any new functionality
4. **Update documentation** as needed
5. **Ensure all tests pass** (`npm test`)
6. **Ensure code is formatted** (`npm run format`)
7. **Ensure no lint errors** (`npm run lint`)
8. **Submit your pull request**

## Development Setup

### Prerequisites

- Node.js 20 or later
- npm or pnpm
- Git

### Getting Started

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/azd-extensions.git
cd azd-extensions

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Define proper types for all functions and variables
- Avoid using `any` type
- Use meaningful variable and function names

### React

- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks
- Use proper prop types

### Styling

- Use Tailwind CSS utilities
- Follow the existing design system
- Ensure responsive design for all screen sizes
- Use semantic HTML

### Testing

- Write tests for all new features
- Maintain or improve code coverage
- Use descriptive test names
- Follow the AAA pattern (Arrange, Act, Assert)

### Commits

- Use clear, descriptive commit messages
- Follow conventional commits format:
  - `feat: add new feature`
  - `fix: resolve bug`
  - `docs: update documentation`
  - `test: add tests`
  - `refactor: code improvement`
  - `style: formatting changes`
  - `chore: maintenance tasks`

## Testing

Run the full test suite:

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Generate coverage report
pnpm test:coverage
```

Ensure coverage remains above 80%.

## Code Review Process

1. All PRs require at least one review
2. CI checks must pass
3. Code coverage must not decrease
4. Documentation must be updated
5. Tests must pass

## Adding a New Extension to the Registry

To add a new extension:

1. Update `registry.json` with extension details
2. Follow the official schema
3. Include all required fields:
   - `id`: Unique identifier
   - `displayName`: Human-readable name
   - `description`: Clear description
   - `version`: Semantic version
   - `repository`: GitHub repository URL
4. Test locally before submitting
5. Submit a PR with the changes

## Documentation

- Update README.md for significant changes
- Add JSDoc comments for complex functions
- Update component documentation
- Keep examples up to date

## Questions?

If you have questions, feel free to:

- Open an issue for discussion
- Check existing issues and PRs
- Review the Azure Developer CLI documentation

Thank you for contributing! 🎉
