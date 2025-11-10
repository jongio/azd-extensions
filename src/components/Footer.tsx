export function Footer() {
  return (
    <footer className="bg-muted/50 border-t py-6">
      <div className="text-muted-foreground container mx-auto px-4 text-center text-sm">
        <p>
          Built with React 19, Vite, TypeScript, Tailwind CSS 4, and shadcn/ui by{' '}
          <a
            href="https://github.com/jongio"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline-offset-4 hover:underline"
          >
            Jon Gallant
          </a>
        </p>
        <p className="mt-2">
          Learn more about{' '}
          <a
            href="https://learn.microsoft.com/azure/developer/azure-developer-cli/overview"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline-offset-4 hover:underline"
          >
            Azure Developer CLI
          </a>
        </p>
      </div>
    </footer>
  )
}
