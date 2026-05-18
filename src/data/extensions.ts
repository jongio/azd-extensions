// Registry data: see scripts/lib/extensions.js for the canonical extension list
import type { Props as Extension } from '../components/ExtensionShowcase.astro';

export type { Extension };

export const extensions: Extension[] = [
  {
    id: 'jongio.azd.app',
    name: 'azd app',
    tagline: 'Run Azure Apps Locally',
    description: 'One command starts all your services with auto-dependencies, real-time dashboard, and AI-powered debugging via GitHub Copilot MCP integration.',
    icon: '▶',
    website: 'https://jongio.github.io/azd-app/',
    repository: 'https://github.com/jongio/azd-app',
    glowColor: 'var(--color-glow-cyan)',
    features: [
      { icon: '▶', title: 'One-Command Start', desc: 'All services, auto-dependencies' },
      { icon: '📊', title: 'Real-time Dashboard', desc: 'Live status & health checks' },
      { icon: '🤖', title: 'Copilot MCP', desc: '10 AI tools for debugging' },
      { icon: '🌐', title: 'Multi-Language', desc: 'Node, Python, .NET, Go, Java' },
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
    id: 'jongio.azd.copilot',
    name: 'azd copilot',
    tagline: 'AI-Powered Azure Assistant',
    description: 'Describe what you want to build, and Copilot builds and deploys it to Azure. Includes 16 specialized agents and 29 Azure skills with GitHub Copilot integration.',
    icon: '⚡',
    website: 'https://jongio.github.io/azd-copilot/',
    repository: 'https://github.com/jongio/azd-copilot',
    glowColor: 'var(--color-glow-violet)',
    features: [
      { icon: '🤖', title: '16 Agents', desc: 'Specialized AI agents for Azure tasks' },
      { icon: '✨', title: '29 Azure Skills', desc: 'Deep Azure service integration' },
      { icon: '💬', title: 'Interactive Mode', desc: 'Chat or single-prompt execution' },
      { icon: '🔌', title: 'MCP Server', desc: 'GitHub Copilot MCP integration' },
    ],
    scenarios: [
      { title: 'Interactive Session', command: 'azd copilot' },
      { title: 'Single Prompt', command: "azd copilot 'build a REST API'" },
      { title: 'Use Specific Agent', command: 'azd copilot --agent azure-security' },
      { title: 'List Agents', command: 'azd copilot agents' },
    ],
    tags: ['ai', 'copilot', 'agents', 'mcp-server'],
  },
  {
    id: 'jongio.azd.rest',
    name: 'azd rest',
    tagline: 'Authenticated REST API Calls',
    description: 'Make REST API calls to Azure services with automatic authentication and scope detection. No manual token management — just point at a URL and go.',
    icon: '🌐',
    website: 'https://jongio.github.io/azd-rest/',
    repository: 'https://github.com/jongio/azd-rest',
    glowColor: 'var(--color-glow-amber)',
    features: [
      { icon: '🔄', title: 'Auto Auth', desc: 'Automatic scope detection & tokens' },
      { icon: '⚡', title: 'All HTTP Methods', desc: 'GET, POST, PUT, PATCH, DELETE' },
      { icon: '🔐', title: '20+ Services', desc: 'Management, Graph, Key Vault, more' },
      { icon: '🛡️', title: 'Secure by Default', desc: 'HTTPS, credential chain, retries' },
    ],
    scenarios: [
      { title: 'List Subscriptions', command: 'azd rest get https://management.azure.com/subscriptions?api-version=2020-01-01' },
      { title: 'Key Vault Secret', command: 'azd rest get https://myvault.vault.azure.net/secrets/mysecret?api-version=7.4' },
      { title: 'Microsoft Graph', command: 'azd rest get https://graph.microsoft.com/v1.0/me' },
    ],
    tags: ['rest', 'api', 'http', 'developer-tools'],
  },
];
