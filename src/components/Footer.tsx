import { Github, Heart } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-white/5 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="text-muted-foreground flex items-center gap-1 text-sm">
            <span>Built with</span>
            <Heart className="h-4 w-4 text-[var(--color-glow-violet)]" />
            <span>by</span>
            <a
              href="https://github.com/jongio"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:text-primary font-medium transition-colors"
            >
              Jon Gallant
            </a>
          </div>

          <div className="text-muted-foreground flex items-center gap-6 text-sm">
            <a
              href="https://learn.microsoft.com/azure/developer/azure-developer-cli/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              Azure Developer CLI
            </a>
            <a
              href="https://github.com/jongio/azd-extensions"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground flex items-center gap-1.5 transition-colors"
            >
              <Github className="h-4 w-4" />
              <span>Source</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
