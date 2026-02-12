import { Extension } from '@/types/registry'
import { Badge } from '@/components/ui/badge'
import { TerminalCode } from '@/components/TerminalCode'
import { TerminalIcon, PlayerIcon, GithubIcon } from '@/components/icons'
import {
  Key,
  Shield,
  Layers,
  Monitor,
  Bot,
  FolderCode,
  Play,
  Terminal,
  LucideIcon,
  Globe,
  Sparkles,
  Cpu,
  MessageSquare,
  Zap,
} from 'lucide-react'

interface ExtensionCardProps {
  extension: Extension
  index: number
}

// Rich extension data with features and scenarios
const extensionData: Record<
  string,
  {
    tagline: string
    description: string
    website: string
    repository: string
    features: { icon: LucideIcon; title: string; desc: string }[]
    scenarios: { title: string; command: string }[]
    highlight: string
  }
> = {
  'jongio.azd.app': {
    tagline: 'Run Azure Apps Locally',
    description:
      'One command starts all your services with auto-dependencies, real-time dashboard, and AI-powered debugging via GitHub Copilot MCP integration.',
    highlight: 'var(--color-glow-cyan)',
    website: 'https://jongio.github.io/azd-app/',
    repository: 'https://github.com/jongio/azd-app',
    features: [
      { icon: Play, title: 'One-Command Start', desc: 'All services, auto-dependencies' },
      { icon: Monitor, title: 'Real-time Dashboard', desc: 'Live status & health checks' },
      { icon: Bot, title: 'Copilot MCP', desc: '10 AI tools for debugging' },
      { icon: Layers, title: 'Multi-Language', desc: 'Node, Python, .NET, Go, Java' },
    ],
    scenarios: [
      { title: 'Start Everything', command: 'azd app run' },
      { title: 'Check Prerequisites', command: 'azd app reqs' },
      { title: 'View Service Logs', command: 'azd app logs api' },
      { title: 'Run Tests', command: 'azd app test --coverage' },
    ],
  },
  'jongio.azd.copilot': {
    tagline: 'AI-Powered Azure Assistant',
    description:
      'Describe what you want to build, and Copilot builds and deploys it to Azure. Includes 16 specialized agents and 29 Azure skills with GitHub Copilot integration.',
    highlight: 'var(--color-glow-emerald)',
    website: 'https://jongio.github.io/azd-copilot/',
    repository: 'https://github.com/jongio/azd-copilot',
    features: [
      { icon: Bot, title: '16 Agents', desc: 'Specialized AI agents for Azure tasks' },
      { icon: Sparkles, title: '29 Azure Skills', desc: 'Deep Azure service integration' },
      { icon: MessageSquare, title: 'Interactive Mode', desc: 'Chat or single-prompt execution' },
      { icon: Cpu, title: 'MCP Server', desc: 'GitHub Copilot MCP integration' },
    ],
    scenarios: [
      { title: 'Interactive Session', command: 'azd copilot' },
      { title: 'Single Prompt', command: "azd copilot 'build a REST API'" },
      { title: 'Use Specific Agent', command: 'azd copilot --agent azure-security' },
      { title: 'List Agents', command: 'azd copilot agents' },
    ],
  },
  'jongio.azd.exec': {
    tagline: 'Execute Scripts with Azure Context',
    description:
      'Run any script with full access to your Azure credentials, environment variables, and Key Vault secrets. Perfect for automation, migrations, and CI/CD.',
    highlight: 'var(--color-glow-violet)',
    website: 'https://jongio.github.io/azd-exec/',
    repository: 'https://github.com/jongio/azd-exec',
    features: [
      { icon: Key, title: 'Key Vault Integration', desc: 'Auto-resolve secrets at runtime' },
      { icon: Terminal, title: 'Multi-Shell Support', desc: 'Bash, PowerShell, zsh, cmd' },
      { icon: Shield, title: 'Security Scanned', desc: '0 vulnerabilities, 86%+ coverage' },
      { icon: FolderCode, title: 'Working Directory', desc: 'Run from any location' },
    ],
    scenarios: [
      { title: 'Database Migration', command: 'azd exec ./migrate.sh' },
      { title: 'PowerShell Deploy', command: 'azd exec --shell pwsh ./deploy.ps1' },
      { title: 'With Key Vault', command: 'azd exec ./setup-with-secrets.sh' },
    ],
  },
}

export function ExtensionCard({ extension, index }: ExtensionCardProps) {
  const data = extensionData[extension.id] || {
    tagline: extension.displayName,
    description: '',
    highlight: index === 0 ? 'var(--color-glow-cyan)' : 'var(--color-glow-violet)',
    features: [],
    scenarios: [],
    website: '',
    repository: '',
  }

  const isApp = extension.id === 'jongio.azd.app'
  const isCopilot = extension.id === 'jongio.azd.copilot'

  return (
    <div
      className="glass group relative overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.01]"
      style={{
        boxShadow: `0 0 0 1px rgba(148, 163, 184, 0.1)`,
      }}
    >
      {/* Hover glow effect */}
      <div
        className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full opacity-0 blur-[80px] transition-opacity duration-500 group-hover:opacity-20"
        style={{ background: data.highlight }}
      />

      <div className="relative p-6 sm:p-8">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110"
              style={{
                background: `linear-gradient(135deg, ${data.highlight}30, ${data.highlight}10)`,
              }}
            >
              {isApp ? (
                <PlayerIcon size={28} color={data.highlight} />
              ) : isCopilot ? (
                <Zap size={28} color={data.highlight} />
              ) : (
                <TerminalIcon size={28} color={data.highlight} />
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold sm:text-2xl">{extension.displayName}</h3>
              <p className="text-muted-foreground mt-1 text-sm font-medium">{data.tagline}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {data.website && (
              <a
                href={data.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-black/5 dark:hover:bg-white/5"
                aria-label={`Visit ${extension.displayName} website`}
                title="Website"
              >
                <Globe className="h-5 w-5" />
              </a>
            )}
            {data.repository && (
              <a
                href={data.repository}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary flex h-9 w-9 items-center justify-center rounded-lg transition-all hover:bg-black/5 dark:hover:bg-white/5"
                aria-label={`View ${extension.displayName} on GitHub`}
                title="GitHub"
              >
                <GithubIcon size={20} />
              </a>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-muted-foreground mb-6 text-sm leading-relaxed">{data.description}</p>

        {/* Features Grid */}
        {data.features.length > 0 && (
          <div className="mb-6 grid grid-cols-2 gap-3">
            {data.features.map((feature, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg bg-black/5 p-3 dark:bg-white/5"
              >
                <feature.icon
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: data.highlight }}
                />
                <div>
                  <p className="text-xs font-semibold">{feature.title}</p>
                  <p className="text-muted-foreground text-xs">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Scenarios */}
        {data.scenarios.length > 0 && (
          <div className="mb-6">
            <h4 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
              Try It
            </h4>
            <div className="space-y-2">
              {data.scenarios.map((scenario, i) => (
                <div key={i}>
                  <p className="text-muted-foreground mb-1 text-xs">{scenario.title}</p>
                  <TerminalCode code={scenario.command} className="text-xs" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {extension.tags?.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="border px-2 py-0.5 text-xs"
              style={{
                borderColor: `${data.highlight}30`,
                background: `${data.highlight}10`,
                color: data.highlight,
              }}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  )
}
