import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ExtensionCard } from '@/components/ExtensionCard'
import { Extension } from '@/types/registry'

describe('ExtensionCard', () => {
  const mockExtension: Extension = {
    id: 'test.extension',
    displayName: 'Test Extension',
    description: 'A test extension for unit testing',
    version: '1.0.0',
    namespace: 'test',
    tags: ['testing', 'demo'],
    repository: 'https://github.com/test/extension',
  }

  it('renders extension display name', () => {
    render(<ExtensionCard extension={mockExtension} index={0} />)
    expect(screen.getByText('Test Extension')).toBeInTheDocument()
  })

  it('renders extension tags', () => {
    render(<ExtensionCard extension={mockExtension} index={0} />)
    expect(screen.getByText('testing')).toBeInTheDocument()
    expect(screen.getByText('demo')).toBeInTheDocument()
  })

  it('renders extension tags', () => {
    render(<ExtensionCard extension={mockExtension} index={0} />)
    expect(screen.getByText('testing')).toBeInTheDocument()
    expect(screen.getByText('demo')).toBeInTheDocument()
  })

  it('renders repository link when provided', () => {
    render(<ExtensionCard extension={mockExtension} index={0} />)
    const link = screen.getByRole('link', { name: /View Test Extension on GitHub/i })
    expect(link).toHaveAttribute('href', 'https://github.com/test/extension')
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('does not render repository link when not provided', () => {
    const extensionWithoutRepo = { ...mockExtension, repository: undefined }
    render(<ExtensionCard extension={extensionWithoutRepo} index={0} />)
    const links = screen.queryByRole('link', { name: /View.*on GitHub/i })
    expect(links).not.toBeInTheDocument()
  })

  it('renders installation instructions', () => {
    render(<ExtensionCard extension={mockExtension} index={0} />)
    expect(screen.getByText(/azd extension install test\.extension/i)).toBeInTheDocument()
  })
})
