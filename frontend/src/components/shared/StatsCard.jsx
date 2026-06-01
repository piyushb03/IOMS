import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function StatsCard({ title, value, subtitle, icon: Icon, color = 'primary', loading }) {
  const colorMap = {
    primary: {
      bg: 'bg-primary/10 border-primary/20',
      icon: 'text-primary',
      value: 'text-foreground',
    },
    success: {
      bg: 'bg-success/10 border-success/20',
      icon: 'text-success',
      value: 'text-foreground',
    },
    warning: {
      bg: 'bg-warning/10 border-warning/20',
      icon: 'text-warning',
      value: 'text-foreground',
    },
    destructive: {
      bg: 'bg-destructive/10 border-destructive/20',
      icon: 'text-destructive',
      value: 'text-foreground',
    },
  }
  const colors = colorMap[color] ?? colorMap.primary

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-11 w-11 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:border-border/80 hover:shadow-md transition-all duration-200 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className={cn('text-3xl font-bold tracking-tight', colors.value)}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div
            className={cn(
              'flex items-center justify-center w-11 h-11 rounded-xl border transition-transform duration-200 group-hover:scale-110',
              colors.bg,
            )}
          >
            <Icon className={cn('w-5 h-5', colors.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
