import { render, screen, waitFor } from '@/test/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import App from '@/App'

// Mock the fetch to avoid async state updates in tests
beforeEach(() => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ extensions: [] }),
  })
})

describe('App', () => {
  it('renders the main heading', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText(/Supercharge your/i)).toBeInTheDocument()
    })
  })

  it('renders the header component', async () => {
    render(<App />)
    await waitFor(() => {
      // Header has h1 with "jongio/extensions" text
      const headings = screen.getAllByRole('heading', { level: 1 })
      expect(headings.length).toBeGreaterThan(0)
    })
  })

  it('renders the footer', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText(/Built with/i)).toBeInTheDocument()
    })
  })

  it('renders GitHub link in header', async () => {
    render(<App />)
    await waitFor(() => {
      const githubLink = screen.getByRole('link', { name: /Jon Gallant on GitHub/i })
      expect(githubLink).toHaveAttribute('href', 'https://github.com/jongio')
      expect(githubLink).toHaveAttribute('target', '_blank')
    })
  })

  it('renders By Jon Gallant badge', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText(/By Jon Gallant/i)).toBeInTheDocument()
    })
  })

  it('shows loading state initially', () => {
    render(<App />)
    expect(screen.getByText(/Loading extensions/i)).toBeInTheDocument()
  })

  it('renders extensions when fetch succeeds', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          extensions: [
            {
              id: 'jongio.azd.app',
              displayName: 'azd app',
              description: 'Run Azure apps locally',
              version: '1.0.0',
              tags: ['app'],
            },
            {
              id: 'jongio.azd.copilot',
              displayName: 'azd copilot',
              description: 'AI-powered Azure assistant',
              version: '1.0.0',
              tags: ['copilot'],
            },
            {
              id: 'jongio.azd.exec',
              displayName: 'azd exec',
              description: 'Execute scripts',
              version: '1.0.0',
              tags: ['exec'],
            },
          ],
        }),
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('azd app')).toBeInTheDocument()
      expect(screen.getByText('azd exec')).toBeInTheDocument()
    })
  })

  it('sorts extensions in correct order: app, copilot, exec', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          extensions: [
            { id: 'jongio.azd.exec', displayName: 'azd exec', description: '', version: '1.0.0' },
            { id: 'jongio.azd.copilot', displayName: 'azd copilot', description: '', version: '1.0.0' },
            { id: 'jongio.azd.app', displayName: 'azd app', description: '', version: '1.0.0' },
          ],
        }),
    })

    render(<App />)

    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { level: 3 })
      const displayNames = headings.map((h) => h.textContent)
      const appIndex = displayNames.indexOf('azd app')
      const copilotIndex = displayNames.indexOf('azd copilot')
      const execIndex = displayNames.indexOf('azd exec')
      expect(appIndex).toBeLessThan(copilotIndex)
      expect(copilotIndex).toBeLessThan(execIndex)
    })
  })

  it('shows error state when fetch fails', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/Error loading extensions/i)).toBeInTheDocument()
    })
  })

  it('shows empty state when no extensions', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ extensions: [] }),
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/No extensions available/i)).toBeInTheDocument()
    })
  })

  it('renders getting started section with extensions', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          extensions: [
            { id: 'jongio.azd.app', displayName: 'azd app', description: '', version: '1.0.0' },
          ],
        }),
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText(/Get Started in/i)).toBeInTheDocument()
      expect(screen.getByText(/30 Seconds/i)).toBeInTheDocument()
    })
  })
})
