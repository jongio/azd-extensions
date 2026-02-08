import { render, screen } from '@/test/test-utils'
import { describe, it, expect } from 'vitest'
import { Header } from '@/components/Header'

describe('Header', () => {
  it('renders the site title', () => {
    render(<Header />)
    expect(screen.getByText('Azure Developer CLI Extensions')).toBeInTheDocument()
  })

  it('renders X link', () => {
    render(<Header />)
    const xLink = screen.getByRole('link', { name: /Jon Gallant on X/i })
    expect(xLink).toHaveAttribute('href', 'https://x.com/jongallant')
    expect(xLink).toHaveAttribute('target', '_blank')
  })

  it('renders GitHub profile link', () => {
    render(<Header />)
    const githubLink = screen.getByRole('link', { name: /Jon Gallant on GitHub/i })
    expect(githubLink).toHaveAttribute('href', 'https://github.com/jongio')
    expect(githubLink).toHaveAttribute('target', '_blank')
  })
})
