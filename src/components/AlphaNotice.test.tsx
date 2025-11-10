import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AlphaNotice } from '@/components/AlphaNotice'

describe('AlphaNotice', () => {
  it('renders the alpha feature warning', () => {
    render(<AlphaNotice />)
    expect(screen.getByText('Alpha Feature')).toBeInTheDocument()
  })

  it('contains information about alpha status', () => {
    render(<AlphaNotice />)
    expect(screen.getByText(/Azure Developer CLI \(azd\) extensions are currently an/i)).toBeInTheDocument()
  })

  it('displays the configuration command', () => {
    render(<AlphaNotice />)
    expect(screen.getByText(/azd config set alpha\.extensions on/i)).toBeInTheDocument()
  })

  it('warns about production use', () => {
    render(<AlphaNotice />)
    expect(screen.getByText(/not recommended for production use/i)).toBeInTheDocument()
  })
})
