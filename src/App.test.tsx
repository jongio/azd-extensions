import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '@/App'

describe('App', () => {
  it('renders the main heading', () => {
    render(<App />)
    expect(screen.getByText(/Supercharge Your Azure Workflow/i)).toBeInTheDocument()
  })

  it('renders the header component', () => {
    render(<App />)
    const heading = screen.getByRole('heading', { name: /azd extensions/i, level: 1 })
    expect(heading).toBeInTheDocument()
    expect(screen.getByText(/by Jon Gallant/i)).toBeInTheDocument()
  })

  it('renders the alpha notice', () => {
    render(<App />)
    const alphaHeading = screen.getByRole('heading', { name: 'Alpha Feature', level: 3 })
    expect(alphaHeading).toBeInTheDocument()
  })

  it('renders the footer', () => {
    render(<App />)
    expect(screen.getByText(/Built with React 19/i)).toBeInTheDocument()
  })

  it('renders GitHub link in header', () => {
    render(<App />)
    const githubLink = screen.getByRole('link', { name: /azd Extensions on GitHub/i })
    expect(githubLink).toHaveAttribute('href', 'https://github.com/jongio/azd-extensions')
    expect(githubLink).toHaveAttribute('target', '_blank')
  })
})
