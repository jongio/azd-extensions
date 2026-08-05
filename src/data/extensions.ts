// Registry data: see scripts/lib/extensions.js for the canonical extension list
import type { Extension } from '../types/extension'

export type { Extension }

export const extensions: Extension[] = [
  {
    id: 'jongio.azd.app',
    name: 'azd app',
    tagline: 'Run Azure Apps Locally',
    heroClaim: 'runs your whole app locally with one command.',
    description:
      'One command starts all your services with auto-dependencies, real-time dashboard, and AI-powered debugging via GitHub Copilot MCP integration.',
    icon: 'play',
    website: 'https://jongio.github.io/azd-app/',
    repository: 'https://github.com/jongio/azd-app',
    glowColor: 'var(--color-glow-cyan)',
    features: [
      { icon: 'play', title: 'One-Command Start', desc: 'All services, auto-dependencies' },
      { icon: 'chart-column', title: 'Real-time Dashboard', desc: 'Live status & health checks' },
      { icon: 'bot', title: 'Copilot MCP', desc: '12 AI tools for debugging' },
      { icon: 'globe', title: 'Multi-Language', desc: 'Node, Python, .NET, Go, Java' },
    ],
    scenarios: [
      { title: 'Start Everything', command: 'azd app run' },
      { title: 'Check Prerequisites', command: 'azd app reqs' },
      { title: 'View Service Logs', command: 'azd app logs api' },
      { title: 'Run Tests', command: 'azd app test --coverage' },
    ],
    tags: ['developer', 'productivity', 'app', 'testing'],
  },
  {
    id: 'jongio.azd.rest',
    name: 'azd rest',
    tagline: 'Authenticated REST API Calls',
    heroClaim: 'calls any Azure API without wrangling a token.',
    description:
      'Make REST API calls to Azure services with automatic authentication and scope detection. No manual token management, just point at a URL and go.',
    icon: 'globe',
    website: 'https://jongio.github.io/azd-rest/',
    repository: 'https://github.com/jongio/azd-rest',
    glowColor: 'var(--color-glow-amber)',
    features: [
      { icon: 'refresh-cw', title: 'Auto Auth', desc: 'Automatic scope detection & tokens' },
      { icon: 'zap', title: 'All HTTP Methods', desc: 'GET, POST, PUT, PATCH, DELETE' },
      { icon: 'lock-keyhole', title: '20+ Services', desc: 'Management, Graph, Key Vault, more' },
      { icon: 'shield', title: 'Secure by Default', desc: 'HTTPS, credential chain, retries' },
    ],
    scenarios: [
      {
        title: 'List Subscriptions',
        command: 'azd rest get https://management.azure.com/subscriptions?api-version=2020-01-01',
      },
      {
        title: 'Key Vault Secret',
        command: 'azd rest get https://myvault.vault.azure.net/secrets/mysecret?api-version=7.4',
      },
      { title: 'Microsoft Graph', command: 'azd rest get https://graph.microsoft.com/v1.0/me' },
    ],
    tags: ['rest', 'api', 'http', 'developer-tools'],
  },
]
