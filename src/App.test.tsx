import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '@/App'

describe('App', () => {
  it('renders the main heading', () => {
    render(<App />)
    expect(screen.getByText(/Azure Developer CLI Extensions/i)).toBeInTheDocument()
  })

  it('renders the header component', () => {
    render(<App />)
    const heading = screen.getByRole('heading', { name: /azd Extensions/i, level: 1 })
    expect(heading).toBeInTheDocument()
    expect(screen.getByText(/by Jon Gallant/i)).toBeInTheDocument()
  })

  it('renders the alpha notice', () => {
    render(<App />)
    const alphaHeading = screen.getByRole('heading', { name: 'Alpha Feature', level: 3 })
    expect(alphaHeading).toBeInTheDocument()
  })

  it('renders the getting started section', () => {
    render(<App />)
    expect(screen.getByText(/Getting Started/i)).toBeInTheDocument()
  })

  it('renders the footer', () => {
    render(<App />)
    expect(screen.getByText(/Built with React 19/i)).toBeInTheDocument()
  })

  it('renders GitHub link in header', () => {
    render(<App />)
    const githubLink = screen.getByRole('link', { name: /Jon Gallant's GitHub Profile/i })
    expect(githubLink).toHaveAttribute('href', 'https://github.com/jongio')
    expect(githubLink).toHaveAttribute('target', '_blank')
  })
})
