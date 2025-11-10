import { Extension } from '@/types/registry'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TerminalCode } from '@/components/TerminalCode'
import { ExternalLink, Rocket, Zap, Sparkles } from 'lucide-react'

interface ExtensionCardProps {
  extension: Extension
  index: number
}

const extensionExamples: Record<string, { tagline: string; examples: string[] }> = {
  'jongio.azd.app': {
    tagline: 'Zero-config development environment',
    examples: [
      'azd app reqs  # Verify prerequisites',
      'azd app deps  # Install dependencies',
      'azd app run   # Start dev environment',
      'azd app info  # Monitor running services',
    ],
  },
  'jongio.azd.rest': {
    tagline: 'Test APIs instantly with zero auth config',
    examples: [
      'azd rest GET /api/users',
      'azd rest POST /api/data -d {...}',
      'azd rest GET $API_URL/health',
    ],
  },
  'jongio.azd.script': {
    tagline: 'Run scripts with full Azure context',
    examples: [
      'azd script run ./deploy.sh',
      'azd script exec setup.ps1',
      'azd script run migration.sh --verbose',
    ],
  },
}

export function ExtensionCard({ extension, index }: ExtensionCardProps) {
  const data = extensionExamples[extension.id] || { tagline: '', examples: [] }
  const Icon = index === 0 ? Rocket : index === 1 ? Zap : Sparkles

  return (
    <Card className="group relative overflow-hidden transition-all hover:shadow-xl hover:border-primary/50">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-all group-hover:bg-primary/10" />
      
      <CardHeader className="relative pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="rounded-lg bg-primary/10 p-2">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg">{extension.displayName}</CardTitle>
              <CardDescription className="mt-0.5 text-xs">{data.tagline}</CardDescription>
            </div>
          </div>
          {extension.repository && (
            <a
              href={extension.repository}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary shrink-0"
              aria-label={`View ${extension.displayName} on GitHub`}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
        
        <div className="mt-2 flex flex-wrap gap-1.5">
          {extension.tags?.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs px-2 py-0">
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="relative space-y-3 pt-0">
        {/* Examples */}
        {data.examples.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Examples</h4>
            <div className="space-y-1.5">
              {data.examples.map((example, i) => (
                <TerminalCode key={i} code={example} className="text-xs" />
              ))}
            </div>
          </div>
        )}

        {/* Installation */}
        <div className="border-t pt-3">
          <h4 className="mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Install</h4>
          <TerminalCode code={`azd extension install ${extension.id}`} className="text-xs" />
        </div>
      </CardContent>
    </Card>
  )
}
