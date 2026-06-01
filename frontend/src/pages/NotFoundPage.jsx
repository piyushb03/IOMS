import { Link } from 'react-router-dom'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-6 animate-fade-in">
        <div className="space-y-2">
          <p className="text-8xl font-black gradient-text">404</p>
          <h1 className="text-2xl font-bold text-foreground">Page Not Found</h1>
          <p className="text-muted-foreground max-w-sm mx-auto">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => window.history.back()} id="btn-go-back">
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </Button>
          <Button asChild id="btn-go-home">
            <Link to="/">
              <Home className="w-4 h-4" />
              Dashboard
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
