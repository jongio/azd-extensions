import { AlertTriangle } from 'lucide-react'
import { TerminalCode } from '@/components/TerminalCode'

export function AlphaNotice() {
  return (
    <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-500" />
        <div className="flex-1">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">Alpha Feature</h3>
          <p className="mt-1 text-sm text-yellow-800 dark:text-yellow-200">
            Azure Developer CLI (azd) extensions are currently an <strong>alpha feature</strong>. To
            use extensions, you must enable the alpha feature flag:
          </p>
          <div className="mt-2">
            <TerminalCode code="azd config set alpha.extensions on" className="text-xs" />
          </div>
          <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-300">
            Features may change and are not recommended for production use.
          </p>
        </div>
      </div>
    </div>
  )
}
