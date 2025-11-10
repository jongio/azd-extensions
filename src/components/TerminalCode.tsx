import { useState } from 'react'
import { Check, Copy } from 'lucide-react'

interface TerminalCodeProps {
  code: string
  showPrompt?: boolean
  className?: string
}

export function TerminalCode({ code, showPrompt = true, className = '' }: TerminalCodeProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={`group relative flex items-center gap-3 rounded-lg border border-border/60 bg-gradient-to-br from-muted/80 to-muted/40 px-4 py-3 font-mono text-sm shadow-sm backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-md hover:from-muted hover:to-muted/60 ${className}`}
    >
      {showPrompt && <span className="select-none text-primary font-semibold">❯</span>}
      <span className="flex-1 text-foreground/90">{code}</span>
      <button
        onClick={handleCopy}
        className="opacity-0 transition-all hover:text-primary group-hover:opacity-100"
        aria-label="Copy to clipboard"
        title="Copy to clipboard"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  )
}
