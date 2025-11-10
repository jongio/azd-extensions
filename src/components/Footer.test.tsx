import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Footer } from '@/components/Footer'

describe('Footer', () => {
  it('renders technology stack information', () => {
    render(<Footer />)
    expect(screen.getByText(/Built with React 19/i)).toBeInTheDocument()
  })

  it('mentions all key technologies', () => {
    render(<Footer />)
    const footerText = screen.getByText(/React 19.*Vite.*TypeScript.*Tailwind CSS 4.*shadcn\/ui/i)
    expect(footerText).toBeInTheDocument()
  })

  it('renders Jon Gallant link', () => {
    render(<Footer />)
    const links = screen.getAllByRole('link', { name: /Jon Gallant/i })
    expect(links[0]).toHaveAttribute('href', 'https://github.com/jongio')
    expect(links[0]).toHaveAttribute('target', '_blank')
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
})
