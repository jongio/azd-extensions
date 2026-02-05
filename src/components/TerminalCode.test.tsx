import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TerminalCode } from '@/components/TerminalCode'

describe('TerminalCode', () => {
  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  it('renders code content', () => {
    render(<TerminalCode code="npm install" />)
    expect(screen.getByText('npm install')).toBeInTheDocument()
  })

  it('renders terminal prompt icon by default', () => {
    render(<TerminalCode code="test command" />)
    // The Terminal icon from lucide-react renders as SVG
    const terminalIcon = document.querySelector('svg.lucide-terminal')
    expect(terminalIcon).toBeInTheDocument()
  })

  it('hides prompt when showPrompt is false', () => {
    render(<TerminalCode code="test command" showPrompt={false} />)
    const terminalIcon = document.querySelector('svg.lucide-terminal')
    expect(terminalIcon).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    render(<TerminalCode code="test" className="custom-class" />)
    const container = screen.getByText('test').closest('div')
    expect(container).toHaveClass('custom-class')
  })

  it('copies code to clipboard when copy button is clicked', async () => {
    render(<TerminalCode code="azd app run" />)

    const copyButton = screen.getByRole('button', { name: /copy to clipboard/i })
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('azd app run')
    })
  })

  it('handles clipboard success state', async () => {
    render(<TerminalCode code="test" />)

    const copyButton = screen.getByRole('button', { name: /copy to clipboard/i })
    fireEvent.click(copyButton)

    // After clicking, the clipboard should have been called
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test')
    })
  })

  it('handles clipboard error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const clipboardMock = vi.fn().mockRejectedValue(new Error('Permission denied'))
    Object.assign(navigator, {
      clipboard: {
        writeText: clipboardMock,
      },
    })

    render(<TerminalCode code="test" />)

    const copyButton = screen.getByRole('button', { name: /copy to clipboard/i })
    fireEvent.click(copyButton)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy to clipboard')
    })

    consoleSpy.mockRestore()
  })
})
