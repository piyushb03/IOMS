import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Zap,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/products', icon: Package, label: 'Products' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/orders', icon: ShoppingCart, label: 'Orders' },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside
      className="flex flex-col w-64 shrink-0 border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))]"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-[hsl(var(--sidebar-border))]">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 border border-primary/20">
          <Zap className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight text-foreground">IOMS</h1>
          <p className="text-[10px] text-muted-foreground tracking-widest uppercase">
            Inventory & Orders
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Menu
        </p>
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive =
            to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to)

          return (
            <NavLink
              key={to}
              to={to}
              id={`nav-${label.toLowerCase()}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground border border-transparent',
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 shrink-0 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              />
              {label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[hsl(var(--sidebar-border))]">
        <p className="text-[10px] text-muted-foreground">
          v1.0.0 &nbsp;·&nbsp; Production
        </p>
      </div>
    </aside>
  )
}
