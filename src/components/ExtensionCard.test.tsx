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
  }

  const mockAppExtension: Extension = {
    id: 'jongio.azd.app',
    displayName: 'azd app',
    description: 'Run Azure apps locally',
    version: '1.0.0',
    tags: ['app', 'local'],
  }

  const mockExecExtension: Extension = {
    id: 'jongio.azd.exec',
    displayName: 'azd exec',
    description: 'Execute scripts with Azure context',
    version: '1.0.0',
    tags: ['exec', 'scripts'],
  }

  it('renders extension display name in heading', () => {
    render(<ExtensionCard extension={mockExtension} index={0} />)
    expect(screen.getByRole('heading', { level: 3, name: 'Test Extension' })).toBeInTheDocument()
  })

  it('renders extension tags', () => {
    render(<ExtensionCard extension={mockExtension} index={0} />)
    expect(screen.getByText('testing')).toBeInTheDocument()
    expect(screen.getByText('demo')).toBeInTheDocument()
  })

  it('renders installation instructions', () => {
    render(<ExtensionCard extension={mockExtension} index={0} />)
    expect(screen.getByText(/azd extension install test\.extension/i)).toBeInTheDocument()
  })

  it('renders azd app extension with rich data', () => {
    render(<ExtensionCard extension={mockAppExtension} index={0} />)
    expect(screen.getByText('Run Azure Apps Locally')).toBeInTheDocument()
    expect(screen.getByText('One-Command Start')).toBeInTheDocument()
    expect(screen.getByText('Real-time Dashboard')).toBeInTheDocument()
  })

  it('renders azd exec extension with rich data', () => {
    render(<ExtensionCard extension={mockExecExtension} index={1} />)
    expect(screen.getByText('Execute Scripts with Azure Context')).toBeInTheDocument()
    expect(screen.getByText('Key Vault Integration')).toBeInTheDocument()
    expect(screen.getByText('Multi-Shell Support')).toBeInTheDocument()
  })

  it('renders scenarios for known extensions', () => {
    render(<ExtensionCard extension={mockAppExtension} index={0} />)
    expect(screen.getByText('Start Everything')).toBeInTheDocument()
    expect(screen.getByText(/azd app run/)).toBeInTheDocument()
  })

  it('renders website and repository links for known extensions', () => {
    render(<ExtensionCard extension={mockAppExtension} index={0} />)
    const links = screen.getAllByRole('link')
    const websiteLink = links.find(
      (link) => link.getAttribute('href') === 'https://jongio.github.io/azd-app/'
    )
    const repoLink = links.find(
      (link) => link.getAttribute('href') === 'https://github.com/jongio/azd-app'
    )
    expect(websiteLink).toBeInTheDocument()
    expect(repoLink).toBeInTheDocument()
  })

  it('handles extension without tags gracefully', () => {
    const extensionWithoutTags: Extension = {
      id: 'no.tags',
      displayName: 'No Tags Extension',
      description: 'An extension without tags',
      version: '1.0.0',
    }
    render(<ExtensionCard extension={extensionWithoutTags} index={0} />)
    expect(screen.getByRole('heading', { level: 3, name: 'No Tags Extension' })).toBeInTheDocument()
  })
})
