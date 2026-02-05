import { render, screen, waitFor } from '@testing-library/react'
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
      expect(screen.getByText(/Supercharge Your Azure Workflow/i)).toBeInTheDocument()
    })
  })

  it('renders the header component', async () => {
    render(<App />)
    await waitFor(() => {
      const heading = screen.getByRole('heading', { name: /azd extensions/i, level: 1 })
      expect(heading).toBeInTheDocument()
      expect(screen.getByText(/by Jon Gallant/i)).toBeInTheDocument()
    })
  })

  it('renders the alpha notice', async () => {
    render(<App />)
    await waitFor(() => {
      const alphaHeading = screen.getByRole('heading', { name: 'Alpha Feature', level: 3 })
      expect(alphaHeading).toBeInTheDocument()
    })
  })

  it('renders the footer', async () => {
    render(<App />)
    await waitFor(() => {
      expect(screen.getByText(/Built with React 19/i)).toBeInTheDocument()
    })
  })

  it('renders GitHub link in header', async () => {
    render(<App />)
    await waitFor(() => {
      const githubLink = screen.getByRole('link', { name: /azd Extensions on GitHub/i })
      expect(githubLink).toHaveAttribute('href', 'https://github.com/jongio/azd-extensions')
      expect(githubLink).toHaveAttribute('target', '_blank')
    })
  })
})
