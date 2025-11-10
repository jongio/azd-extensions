import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { AlphaNotice } from '@/components/AlphaNotice'
import { ExtensionCard } from '@/components/ExtensionCard'
import { TerminalCode } from '@/components/TerminalCode'
import { Extension, Registry } from '@/types/registry'

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
        setExtensions(data.extensions || [])
        setLoading(false)
      })
      .catch((err) => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <div className="from-primary/5 to-background bg-gradient-to-b">
          <div className="container mx-auto px-4 py-6 sm:py-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="mb-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Supercharge Your Azure Workflow
              </h1>
              <p className="text-muted-foreground mx-auto max-w-2xl text-sm sm:text-base">
                Powerful extensions that transform how you build, deploy, and manage Azure
                applications.
              </p>
              <div className="mt-4">
                <a
                  href="https://learn.microsoft.com/azure/developer/azure-developer-cli/azd-extensibility"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-primary/10 text-primary hover:bg-primary/20 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:shadow-md"
                >
                  Learn about azd extensions →
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Alpha Notice */}
          <div className="mb-8">
            <AlphaNotice />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="text-muted-foreground mt-4">Loading extensions...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="border-destructive/50 bg-destructive/10 rounded-lg border p-4 text-center">
              <p className="text-destructive">Error loading extensions: {error}</p>
            </div>
          )}

          {/* Extensions Grid - Above the fold */}
          {!loading && !error && extensions.length === 0 && (
            <div className="rounded-lg border border-dashed p-12 text-center">
              <p className="text-muted-foreground text-lg">
                No extensions available yet. Check back soon!
              </p>
            </div>
          )}

          {!loading && !error && extensions.length > 0 && (
            <>
              <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold sm:text-3xl">Available Extensions</h2>
                <p className="text-muted-foreground mt-2">
                  Click any extension to learn more and get started
                </p>
              </div>
              <div className="mb-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {extensions.map((extension, index) => (
                  <ExtensionCard key={extension.id} extension={extension} index={index} />
                ))}
              </div>
            </>
          )}

          {/* Getting Started CTA */}
          {!loading && !error && extensions.length > 0 && (
            <div className="border-primary/20 from-primary/5 via-background to-background rounded-2xl border-2 bg-gradient-to-br p-8 shadow-lg sm:p-12">
              <div className="mx-auto max-w-3xl text-center">
                <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Ready to Get Started?</h2>
                <p className="text-muted-foreground mb-8 text-lg">
                  Install any extension in seconds and start boosting your Azure development
                  productivity.
                </p>
                <div className="space-y-4">
                  <div className="text-left">
                    <h4 className="text-foreground mb-2 font-semibold">1. Enable Extensions</h4>
                    <TerminalCode code="azd config set alpha.extensions on" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-foreground mb-2 font-semibold">2. Add Registry</h4>
                    <TerminalCode code='azd extension source add -n jongio -t url -l "https://jongio.github.io/azd-extensions/registry.json"' />
                  </div>
                  <div className="text-left">
                    <h4 className="text-foreground mb-2 font-semibold">3. Install Extension</h4>
                    <TerminalCode code="azd extension install jongio.azd.app" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default App
