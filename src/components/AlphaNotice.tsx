import { Zap } from 'lucide-react'
import { TerminalCode } from '@/components/TerminalCode'

export function AlphaNotice() {
  return (
    <div className="glass mx-auto max-w-2xl rounded-xl border-[var(--color-glow-violet)]/20 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-glow-violet)]/20">
          <Zap className="h-4 w-4 text-[var(--color-glow-violet)]" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-[var(--color-glow-violet)]">Alpha Feature</h3>
          <p className="text-muted-foreground mt-1 text-sm">
            Extensions require the alpha flag. Enable with:
          </p>
          <div className="mt-2">
            <TerminalCode code="azd config set alpha.extensions on" className="text-xs" />
          </div>
        </div>
      </div>
    </div>
  )
}
