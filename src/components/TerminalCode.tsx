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
      className={`group border-border/60 from-muted/80 to-muted/40 hover:border-primary/40 hover:from-muted hover:to-muted/60 relative flex items-center gap-3 rounded-lg border bg-gradient-to-br px-4 py-3 font-mono text-sm shadow-sm backdrop-blur-sm transition-all hover:shadow-md ${className}`}
    >
      {showPrompt && <span className="text-primary font-semibold select-none">❯</span>}
      <span className="text-foreground/90 flex-1">{code}</span>
      <button
        onClick={handleCopy}
        className="hover:text-primary opacity-0 transition-all group-hover:opacity-100"
        aria-label="Copy to clipboard"
        title="Copy to clipboard"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  )
}
