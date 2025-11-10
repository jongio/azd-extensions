import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Header } from '@/components/Header'

describe('Header', () => {
  it('renders the site title', () => {
    render(<Header />)
    expect(screen.getByText('azd Extensions')).toBeInTheDocument()
  })

  it('renders the author name', () => {
    render(<Header />)
    expect(screen.getByText('by Jon Gallant')).toBeInTheDocument()
  })

  it('renders GitHub link', () => {
    render(<Header />)
    const githubLink = screen.getByRole('link', { name: /Jon Gallant's GitHub Profile/i })
    expect(githubLink).toHaveAttribute('href', 'https://github.com/jongio')
    expect(githubLink).toHaveAttribute('target', '_blank')
    expect(githubLink).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('renders GitHub button with icon', () => {
    render(<Header />)
    expect(screen.getByText('GitHub')).toBeInTheDocument()
  })
})
