import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'destructive',
  loading = false,
}) {
  return (
    <AlertDialog.Root open={open} onOpenChange={onOpenChange}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <AlertDialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
            'w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-2xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
        >
          <AlertDialog.Title className="text-lg font-semibold text-foreground">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm text-muted-foreground">
            {description}
          </AlertDialog.Description>
          <div className="mt-6 flex gap-3 justify-end">
            <AlertDialog.Cancel asChild>
              <Button variant="outline" disabled={loading} id="btn-confirm-cancel">
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                variant={variant}
                disabled={loading}
                onClick={onConfirm}
                id="btn-confirm-action"
              >
                {loading ? 'Processing…' : confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
