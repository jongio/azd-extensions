import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { ExtensionCard } from '@/components/ExtensionCard'
import { TerminalCode } from '@/components/TerminalCode'
import { Extension, Registry } from '@/types/registry'
import { ArrowRight, Terminal } from 'lucide-react'
import { SparklesIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'

function App() {
  const [extensions, setExtensions] = useState<Extension[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/azd-extensions/registry.json')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to load registry')
        }
        return response.json()
      })
      .then((data: Registry) => {
        // Sort extensions: azd-app first, then azd-exec, then others
        const sorted = (data.extensions || []).sort((a, b) => {
          const order: Record<string, number> = {
            'jongio.azd.app': 0,
            'jongio.azd.exec': 1,
          }
          return (order[a.id] ?? 99) - (order[b.id] ?? 99)
        })
        setExtensions(sorted)
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <div className="relative flex min-h-screen flex-col">
      {/* Animated background elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-pulse-glow absolute -top-40 -left-40 h-80 w-80 rounded-full bg-[var(--color-glow-cyan)] opacity-20 blur-[100px]" />
        <div
          className="animate-pulse-glow absolute top-1/3 -right-40 h-96 w-96 rounded-full bg-[var(--color-glow-violet)] opacity-15 blur-[120px]"
          style={{ animationDelay: '2s' }}
        />
        <div
          className="animate-pulse-glow absolute -bottom-40 left-1/3 h-72 w-72 rounded-full bg-[var(--color-glow-emerald)] opacity-10 blur-[100px]"
          style={{ animationDelay: '4s' }}
        />
      </div>

      <Header />

      <main className="relative flex-1 pt-16">
        {/* Hero Section - Focused on Jon's extensions */}
        <div className="hero-gradient relative overflow-hidden">
          <div className="container mx-auto px-4 py-20 sm:py-28 lg:py-36">
            <div className="mx-auto max-w-4xl text-center">
              {/* Badge - More prominent */}
              <a
                href="https://github.com/jongio"
                target="_blank"
                rel="noopener noreferrer"
                className="animate-fade-up mb-8 inline-flex items-center gap-2.5 rounded-full border border-[var(--color-glow-cyan)]/30 bg-[var(--color-glow-cyan)]/10 px-5 py-2 text-base font-medium text-[var(--color-glow-cyan)] transition-all hover:border-[var(--color-glow-cyan)]/50 hover:bg-[var(--color-glow-cyan)]/20 sm:px-6 sm:py-2.5 sm:text-lg"
              >
                <SparklesIcon size={20} color="var(--color-glow-cyan)" />
                Azure Developer CLI Extensions by Jon Gallant
              </a>

              {/* Main heading */}
              <h1
                className="animate-fade-up mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl"
                style={{ animationDelay: '0.1s' }}
              >
                Supercharge your{' '}
                <span className="text-gradient-animated">Azure workflow</span>
              </h1>

              <p
                className="animate-fade-up text-muted-foreground mx-auto mb-10 max-w-2xl text-lg sm:text-xl"
                style={{ animationDelay: '0.2s' }}
              >
                <strong className="text-foreground">azd app</strong> runs your entire app locally.{' '}
                <strong className="text-foreground">azd exec</strong> runs scripts with Azure
                credentials. Powerful extensions that transform your development experience.
              </p>

              {/* CTA Buttons */}
              <div
                className="animate-fade-up flex flex-col items-center justify-center gap-4 sm:flex-row"
                style={{ animationDelay: '0.3s' }}
              >
                <a href="#extensions">
                  <Button
                    size="lg"
                    className="glow-cyan group bg-primary hover:bg-primary/90 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
                  >
                    See the Extensions
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </a>
                <a href="#getting-started">
                  <Button
                    size="lg"
                    variant="outline"
                    className="glass border-primary/30 hover:border-primary/50 hover:bg-primary/10"
                  >
                    <Terminal className="mr-2 h-4 w-4" />
                    Quick Start
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Decorative floating elements */}
          <div className="animate-float pointer-events-none absolute top-20 left-10 h-2 w-2 rounded-full bg-[var(--color-glow-cyan)] opacity-60" />
          <div className="animate-float-delayed pointer-events-none absolute top-40 right-20 h-3 w-3 rounded-full bg-[var(--color-glow-violet)] opacity-50" />
        </div>

        <div className="container mx-auto px-4 py-12 sm:py-16">
          {/* Loading State */}
          {loading && (
            <div className="py-20 text-center">
              <div className="from-primary to-accent inline-block h-10 w-10 animate-spin rounded-full bg-gradient-to-r p-1">
                <div className="bg-background h-full w-full rounded-full" />
              </div>
              <p className="text-muted-foreground mt-4">Loading extensions...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="glass rounded-2xl border-red-500/20 p-6 text-center">
              <p className="text-destructive">Error loading extensions: {error}</p>
            </div>
          )}

          {/* Extensions - Front and Center */}
          {!loading && !error && extensions.length > 0 && (
            <section id="extensions" className="scroll-mt-24">
              <div className="mb-12 text-center">
                <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                  The <span className="text-gradient">Extensions</span>
                </h2>
                <p className="text-muted-foreground mx-auto max-w-2xl text-lg">
                  Built to solve real problems. Battle-tested with comprehensive security scanning,
                  cross-platform support, and extensive documentation.
                </p>
              </div>

              {/* Extension Cards - 2 column for both extensions */}
              <div className="mb-20 grid gap-8 lg:grid-cols-2">
                {extensions.map((extension, index) => (
                  <ExtensionCard key={extension.id} extension={extension} index={index} />
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {!loading && !error && extensions.length === 0 && (
            <div className="glass rounded-2xl border-dashed p-16 text-center">
              <p className="text-muted-foreground text-lg">
                No extensions available yet. Check back soon!
              </p>
            </div>
          )}

          {/* Getting Started CTA */}
          {!loading && !error && extensions.length > 0 && (
            <section id="getting-started" className="scroll-mt-24">
              <div className="glass glow-violet relative overflow-hidden rounded-3xl border-[var(--color-glow-violet)]/20 p-8 sm:p-12">
                {/* Background glow */}
                <div className="pointer-events-none absolute -top-20 -right-20 h-60 w-60 rounded-full bg-[var(--color-glow-violet)] opacity-10 blur-[80px]" />

                <div className="relative mx-auto max-w-3xl">
                  <div className="mb-8 text-center">
                    <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
                      Get Started in <span className="text-gradient">30 Seconds</span>
                    </h2>
                    <p className="text-muted-foreground text-lg">
                      Install Jon's extensions and supercharge your Azure workflow
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div className="group">
                      <div className="mb-2 flex items-center gap-3">
                        <span className="from-primary to-accent flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white">
                          1
                        </span>
                        <h4 className="font-semibold">Install Azure Developer CLI</h4>
                      </div>
                      <div className="space-y-2">
                        <p className="text-muted-foreground text-xs">Windows (winget)</p>
                        <TerminalCode code="winget install microsoft.azd" />
                        <p className="text-muted-foreground mt-2 text-xs">macOS (Homebrew)</p>
                        <TerminalCode code="brew install azd" />
                        <p className="text-muted-foreground mt-2 text-xs">Linux</p>
                        <TerminalCode code="curl -fsSL https://aka.ms/install-azd.sh | bash" />
                      </div>
                    </div>

                    <div className="group">
                      <div className="mb-2 flex items-center gap-3">
                        <span className="from-primary to-accent flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white">
                          2
                        </span>
                        <h4 className="font-semibold">Enable Extensions</h4>
                      </div>
                      <TerminalCode code="azd config set alpha.extensions on" />
                    </div>

                    <div className="group">
                      <div className="mb-2 flex items-center gap-3">
                        <span className="from-primary to-accent flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white">
                          3
                        </span>
                        <h4 className="font-semibold">Add Extension Registry</h4>
                      </div>
                      <TerminalCode code='azd extension source add jongio "https://jongio.github.io/azd-extensions/registry.json"' />
                    </div>

                    <div className="group">
                      <div className="mb-2 flex items-center gap-3">
                        <span className="from-primary to-accent flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br text-sm font-bold text-white">
                          4
                        </span>
                        <h4 className="font-semibold">Install Extensions</h4>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-muted-foreground mb-2 text-sm font-medium">
                            Install all
                          </p>
                          <TerminalCode code="azd extension install jongio.azd.app jongio.azd.exec" />
                        </div>
                        <div className="border-muted border-t pt-4">
                          <p className="text-muted-foreground mb-2 text-sm font-medium">
                            Or install individually
                          </p>
                          <div className="space-y-2">
                            <TerminalCode code="azd extension install jongio.azd.app" />
                            <TerminalCode code="azd extension install jongio.azd.exec" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App
