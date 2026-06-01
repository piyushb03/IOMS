import { useLocation } from 'react-router-dom'
import { Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/customers': 'Customers',
  '/orders': 'Orders',
}

export function Header() {
  const location = useLocation()
  const title = PAGE_TITLES[location.pathname] ?? 'IOMS'
  const now = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-card/50 backdrop-blur-sm shrink-0">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground hidden sm:block">{now}</p>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" aria-label="Notifications" id="btn-notifications">
          <Bell className="w-4 h-4" />
        </Button>
        <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
          <span className="text-xs font-semibold text-primary">A</span>
        </div>
      </div>
    </header>
  )
}
