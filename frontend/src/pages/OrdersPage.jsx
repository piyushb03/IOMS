import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus, Trash2, ShoppingCart, ChevronLeft, ChevronRight, Eye, X,
} from 'lucide-react'
import { useOrders, useCreateOrder, useDeleteOrder } from '@/hooks/useOrders'
import { useCustomers } from '@/hooks/useCustomers'
import { useProducts } from '@/hooks/useProducts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDate, getStatusColor } from '@/lib/utils'

const orderSchema = z.object({
  customer_id: z.string().min(1, 'Select a customer'),
  items: z.array(
    z.object({
      product_id: z.string().min(1, 'Select a product'),
      quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1'),
    }),
  ).min(1, 'Add at least one item'),
})

function CreateOrderDialog({ open, onOpenChange }) {
  const { toast } = useToast()
  const createOrder = useCreateOrder()

  const { data: customersData } = useCustomers({ limit: 100 })
  const { data: productsData } = useProducts({ limit: 100 })

  const customers = customersData?.items ?? []
  const products = productsData?.items ?? []

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(orderSchema),
    defaultValues: { customer_id: '', items: [{ product_id: '', quantity: 1 }] },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const watchedItems = watch('items')

  // Calculate live order total preview
  const orderTotal = watchedItems.reduce((sum, item) => {
    const product = products.find((p) => p.id === item.product_id)
    if (!product || !item.quantity) return sum
    return sum + Number(product.price) * Number(item.quantity)
  }, 0)

  const onSubmit = async (data) => {
    try {
      await createOrder.mutateAsync(data)
      toast({ title: 'Order created successfully!', variant: 'success' })
      reset()
      onOpenChange(false)
    } catch (err) {
      toast({ title: 'Order failed', description: err.userMessage ?? 'Failed to create order', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Order</DialogTitle>
          <DialogDescription>Select a customer and add products to the order.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" id="order-form">
          {/* Customer selection */}
          <div className="space-y-1.5">
            <Label htmlFor="order-customer">Customer</Label>
            <Select onValueChange={(v) => setValue('customer_id', v)}>
              <SelectTrigger id="order-customer">
                <SelectValue placeholder="Select a customer…" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.full_name} — {c.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.customer_id && (
              <p className="text-xs text-destructive">{errors.customer_id.message}</p>
            )}
          </div>

          {/* Order items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Order Items</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ product_id: '', quantity: 1 })}
                id="btn-add-order-item"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Item
              </Button>
            </div>

            {fields.map((field, index) => {
              const selectedProduct = products.find(
                (p) => p.id === watchedItems[index]?.product_id,
              )
              return (
                <div key={field.id} className="flex items-start gap-3 p-3 border border-border rounded-lg bg-muted/20">
                  <div className="flex-1 space-y-1.5">
                    <Select
                      onValueChange={(v) => setValue(`items.${index}.product_id`, v)}
                      defaultValue={field.product_id}
                    >
                      <SelectTrigger id={`order-product-${index}`}>
                        <SelectValue placeholder="Select product…" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} — {formatCurrency(p.price)} ({p.quantity} in stock)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.items?.[index]?.product_id && (
                      <p className="text-xs text-destructive">{errors.items[index].product_id.message}</p>
                    )}
                  </div>

                  <div className="w-24 space-y-1.5">
                    <Input
                      id={`order-qty-${index}`}
                      type="number"
                      min="1"
                      placeholder="Qty"
                      {...register(`items.${index}.quantity`)}
                    />
                    {errors.items?.[index]?.quantity && (
                      <p className="text-xs text-destructive">{errors.items[index].quantity.message}</p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-1 min-w-[80px]">
                    {selectedProduct && watchedItems[index]?.quantity > 0 && (
                      <span className="text-sm font-semibold tabular-nums">
                        {formatCurrency(Number(selectedProduct.price) * Number(watchedItems[index].quantity))}
                      </span>
                    )}
                    {fields.length > 1 && (
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => remove(index)}
                        aria-label="Remove item"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}

            {errors.items && !Array.isArray(errors.items) && (
              <p className="text-xs text-destructive">{errors.items.message}</p>
            )}
          </div>

          {/* Order total */}
          <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <span className="text-sm font-medium text-muted-foreground">Estimated Total</span>
            <span className="text-xl font-bold text-primary tabular-nums">
              {formatCurrency(orderTotal)}
            </span>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} id="btn-create-order-submit">
              {isSubmitting ? 'Placing Order…' : 'Place Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function OrderDetailDialog({ order, open, onOpenChange }) {
  if (!order) return null
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Order Details</DialogTitle>
          <DialogDescription>
            <span className="font-mono text-xs">{order.id}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-primary tabular-nums">{formatCurrency(order.total_amount)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm">{formatDate(order.created_at)}</p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Items</p>
            <div className="divide-y divide-border border border-border rounded-lg overflow-hidden">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
                  <div>
                    <span className="font-mono text-xs text-muted-foreground">{item.product_id.slice(0, 8)}…</span>
                    <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                  </div>
                  <span className="font-semibold tabular-nums">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function OrdersPage() {
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [detailOrder, setDetailOrder] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data, isLoading, isFetching } = useOrders({ page, limit: 10 })
  const deleteOrder = useDeleteOrder()

  const handleDelete = async () => {
    try {
      await deleteOrder.mutateAsync(deleteTarget.id)
      toast({ title: 'Order deleted', variant: 'success' })
      setDeleteTarget(null)
    } catch (err) {
      toast({ title: 'Error', description: err.userMessage, variant: 'destructive' })
    }
  }

  const orders = data?.items ?? []
  const total = data?.total ?? 0
  const pages = data?.pages ?? 1

  return (
    <div>
      <PageHeader
        title="Orders"
        description={`${total.toLocaleString()} order${total !== 1 ? 's' : ''} total`}
        actions={
          <Button onClick={() => setDialogOpen(true)} id="btn-create-order">
            <Plus className="w-4 h-4" />
            New Order
          </Button>
        }
      />

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Orders table">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order ID</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Total</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={6}>
                    <div className="space-y-3 p-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex gap-4">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-16" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={ShoppingCart}
                      title="No orders yet"
                      description="Create your first order when a customer purchases products."
                      action={
                        <Button size="sm" onClick={() => setDialogOpen(true)} id="btn-create-first-order">
                          <Plus className="w-4 h-4" /> New Order
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className={`hover:bg-muted/20 transition-colors ${isFetching ? 'opacity-70' : ''}`}>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        #{order.id.slice(0, 8)}…
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                      <span className="font-mono text-xs">{order.customer_id.slice(0, 8)}…</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums">
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="View order details"
                          id={`btn-view-order-${order.id}`}
                          onClick={() => setDetailOrder(order)}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          aria-label="Delete order"
                          id={`btn-delete-order-${order.id}`}
                          onClick={() => setDeleteTarget(order)}
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
              <Button size="icon-sm" variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)} id="btn-prev-page-orders">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button size="icon-sm" variant="outline" disabled={page === pages} onClick={() => setPage((p) => p + 1)} id="btn-next-page-orders">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      <CreateOrderDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <OrderDetailDialog
        order={detailOrder}
        open={!!detailOrder}
        onOpenChange={(open) => !open && setDetailOrder(null)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Order"
        description="Delete this order? This action cannot be undone."
        confirmLabel="Delete Order"
        onConfirm={handleDelete}
        loading={deleteOrder.isPending}
      />
    </div>
  )
}
