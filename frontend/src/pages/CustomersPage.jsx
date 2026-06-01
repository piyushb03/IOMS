import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Users, ChevronLeft, ChevronRight, Search, Mail, Phone } from 'lucide-react'
import { useCustomers, useCreateCustomer, useDeleteCustomer } from '@/hooks/useCustomers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useToast } from '@/hooks/useToast'
import { formatDate, debounce } from '@/lib/utils'

const customerSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(255),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(50).optional().or(z.literal('')),
})

function CustomerFormDialog({ open, onOpenChange }) {
  const { toast } = useToast()
  const create = useCreateCustomer()
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(customerSchema),
    defaultValues: { full_name: '', email: '', phone: '' },
  })

  const onSubmit = async (data) => {
    try {
      await create.mutateAsync({ ...data, phone: data.phone || null })
      toast({ title: 'Customer created', variant: 'success' })
      reset()
      onOpenChange(false)
    } catch (err) {
      toast({ title: 'Error', description: err.userMessage ?? 'Failed to create customer', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="customer-form">
          <div className="space-y-1.5">
            <Label htmlFor="cust-name">Full Name</Label>
            <Input id="cust-name" placeholder="e.g. Alice Johnson" {...register('full_name')} />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cust-email">Email Address</Label>
            <Input id="cust-email" type="email" placeholder="alice@example.com" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cust-phone">Phone (optional)</Label>
            <Input id="cust-phone" type="tel" placeholder="+1-555-0100" {...register('phone')} />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} id="btn-customer-submit">
              {isSubmitting ? 'Creating…' : 'Create Customer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function CustomersPage() {
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data, isLoading, isFetching } = useCustomers({ page, limit: 10, search })
  const deleteCustomer = useDeleteCustomer()

  const debouncedSearch = useCallback(
    debounce((val) => { setSearch(val); setPage(1) }, 400),
    [],
  )

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value)
    debouncedSearch(e.target.value)
  }

  const handleDelete = async () => {
    try {
      await deleteCustomer.mutateAsync(deleteTarget.id)
      toast({ title: 'Customer deleted', variant: 'success' })
      setDeleteTarget(null)
    } catch (err) {
      toast({ title: 'Error', description: err.userMessage, variant: 'destructive' })
    }
  }

  const customers = data?.items ?? []
  const total = data?.total ?? 0
  const pages = data?.pages ?? 1

  return (
    <div>
      <PageHeader
        title="Customers"
        description={`${total.toLocaleString()} customer${total !== 1 ? 's' : ''} registered`}
        actions={
          <Button onClick={() => setDialogOpen(true)} id="btn-add-customer">
            <Plus className="w-4 h-4" />
            Add Customer
          </Button>
        }
      />

      {/* Search */}
      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="customer-search"
            placeholder="Search by name, email, phone…"
            value={searchInput}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Customers table">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Phone</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Joined</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={5}>
                    <div className="space-y-3 p-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex gap-4">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-44" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={Users}
                      title="No customers found"
                      description={search ? 'Try a different search term.' : 'Add your first customer to get started.'}
                      action={
                        !search && (
                          <Button size="sm" onClick={() => setDialogOpen(true)} id="btn-add-first-customer">
                            <Plus className="w-4 h-4" /> Add Customer
                          </Button>
                        )
                      }
                    />
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className={`hover:bg-muted/20 transition-colors ${isFetching ? 'opacity-70' : ''}`}>
                    <td className="px-4 py-3 font-medium">{customer.full_name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3 h-3 shrink-0" />
                        {customer.email}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      {customer.phone ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 shrink-0" />
                          {customer.phone}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                      {formatDate(customer.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          aria-label="Delete customer"
                          id={`btn-delete-customer-${customer.id}`}
                          onClick={() => setDeleteTarget(customer)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {page} of {pages} ({total.toLocaleString()} total)
            </p>
            <div className="flex items-center gap-2">
              <Button size="icon-sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)} id="btn-prev-page-customers">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="icon-sm" variant="outline" disabled={page === pages} onClick={() => setPage((p) => p + 1)} id="btn-next-page-customers">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <CustomerFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Customer"
        description={`Remove "${deleteTarget?.full_name}" from your system? This cannot be undone.`}
        confirmLabel="Delete Customer"
        onConfirm={handleDelete}
        loading={deleteCustomer.isPending}
      />
    </div>
  )
}
