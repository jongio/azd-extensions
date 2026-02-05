import { GithubIcon, SparklesIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from './ThemeToggle'

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

export function Header() {
  return (
    <header className="glass-strong fixed top-0 right-0 left-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <a
            href="#"
            className="from-primary to-accent flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br transition-opacity hover:opacity-80"
          >
            <SparklesIcon size={20} color="white" strokeWidth={2} />
          </a>
          <span className="text-sm font-bold tracking-tight sm:text-base lg:text-lg">
            <span className="hidden sm:inline">Azure Developer CLI Extensions</span>
            <span className="sm:hidden">azd extensions</span>
            <span className="text-muted-foreground font-normal"> by </span>
            <a
              href="https://github.com/jongio"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gradient hover:opacity-80"
            >
              Jon Gallant
            </a>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href="https://x.com/jongallant"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Jon Gallant on X"
            className="text-muted-foreground hover:text-foreground rounded-lg p-2 transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </a>
          <a
            href="https://github.com/jongio"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Jon Gallant on GitHub"
          >
            <Button
              variant="outline"
              size="sm"
              className="glass border-primary/20 hover:border-primary/50 hover:glow-cyan"
            >
              <GithubIcon size={16} />
              <span className="hidden sm:inline">jongio</span>
            </Button>
          </a>
        </div>
      </div>
    </header>
  )
}
