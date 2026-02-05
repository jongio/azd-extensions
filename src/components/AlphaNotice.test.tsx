import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { AlphaNotice } from '@/components/AlphaNotice'

describe('AlphaNotice', () => {
  it('renders the alpha feature title', () => {
    render(<AlphaNotice />)
    expect(screen.getByText('Alpha Feature')).toBeInTheDocument()
  })

  it('contains information about enabling extensions', () => {
    render(<AlphaNotice />)
    expect(screen.getByText(/Extensions require the alpha flag/i)).toBeInTheDocument()
  })

  it('displays the configuration command', () => {
    render(<AlphaNotice />)
    expect(screen.getByText(/azd config set alpha\.extensions on/i)).toBeInTheDocument()
  })
})
