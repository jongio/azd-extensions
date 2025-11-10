import { Github } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function Header() {
  return (
    <header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <img src="/azd-extensions/logo.png" alt="Jon Gallant" className="h-10 w-20" />
          <div>
            <h1 className="text-xl leading-tight font-bold">azd extensions</h1>
            <p className="text-muted-foreground text-xs">by Jon Gallant</p>
          </div>
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
