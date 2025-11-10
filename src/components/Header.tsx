import { Github } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">azd Extensions</h1>
          <span className="text-muted-foreground text-sm">by Jon Gallant</span>
        </div>
        <a
          href="https://github.com/jongio/azd-extensions"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="azd Extensions on GitHub"
        >
          <Button variant="outline" size="sm">
            <Github className="h-4 w-4" />
            GitHub
          </Button>
        </a>
      </div>
    </header>
  )
}
