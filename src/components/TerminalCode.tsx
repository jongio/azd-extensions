import { useState } from 'react'
import { Check, Copy, Terminal } from 'lucide-react'

interface TerminalCodeProps {
  code: string
  showPrompt?: boolean
  className?: string
}

export function TerminalCode({ code, showPrompt = true, className = '' }: TerminalCodeProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API may fail if permission denied or not available
      console.warn('Failed to copy to clipboard')
    }
  }

  return (
    <div
      className={`glass group relative flex items-center gap-3 rounded-xl border-[var(--color-primary)]/10 px-4 py-3 font-mono text-sm transition-all hover:border-[var(--color-primary)]/30 hover:shadow-lg ${className}`}
      style={{ background: 'rgba(15, 23, 42, 0.6)' }}
    >
      {showPrompt && <Terminal className="h-4 w-4 shrink-0 text-[var(--color-glow-cyan)]" />}
      <code className="text-foreground/90 flex-1 overflow-x-auto">{code}</code>
      <button
        onClick={handleCopy}
        className="text-muted-foreground hover:text-primary shrink-0 opacity-0 transition-all group-hover:opacity-100"
        aria-label="Copy to clipboard"
        title="Copy to clipboard"
      >
        {copied ? (
          <Check className="h-4 w-4 text-[var(--color-glow-emerald)]" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </button>
    </div>
  )
}
