import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Footer } from '@/components/Footer'

describe('Footer', () => {
  it('renders the built with message', () => {
    render(<Footer />)
    expect(screen.getByText(/Built with/i)).toBeInTheDocument()
  })

  it('renders Jon Gallant link', () => {
    render(<Footer />)
    const link = screen.getByRole('link', { name: /Jon Gallant/i })
    expect(link).toHaveAttribute('href', 'https://github.com/jongio')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('renders Azure Developer CLI link', () => {
    render(<Footer />)
    const azdLink = screen.getByRole('link', { name: /Azure Developer CLI/i })
    expect(azdLink).toHaveAttribute(
      'href',
      'https://learn.microsoft.com/azure/developer/azure-developer-cli/overview'
    )
    expect(azdLink).toHaveAttribute('target', '_blank')
  })

  it('renders Source link to GitHub', () => {
    render(<Footer />)
    const sourceLink = screen.getByRole('link', { name: /Source/i })
    expect(sourceLink).toHaveAttribute('href', 'https://github.com/jongio/azd-extensions')
  })
})
