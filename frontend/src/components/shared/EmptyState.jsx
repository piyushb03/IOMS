import { cn } from '@/lib/utils'

export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in',
        className,
      )}
    >
      {Icon && (
        <div className="flex items-center justify-center w-14 h-14 rounded-full bg-muted mb-4">
          <Icon className="w-7 h-7 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-xs">{description}</p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
