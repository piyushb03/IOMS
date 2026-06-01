import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Plus, Search, Pencil, Trash2, Package, ChevronLeft, ChevronRight,
} from 'lucide-react'
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from '@/hooks/useProducts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, formatDate, getStockColor, debounce } from '@/lib/utils'

const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  sku: z.string().min(1, 'SKU is required').max(100),
  price: z.coerce.number().min(0, 'Price must be non-negative'),
  quantity: z.coerce.number().int().min(0, 'Quantity must be non-negative'),
})

function ProductFormDialog({ open, onOpenChange, product, onSuccess }) {
  const { toast } = useToast()
  const create = useCreateProduct()
  const update = useUpdateProduct()
  const isEdit = !!product

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: product
      ? { name: product.name, sku: product.sku, price: product.price, quantity: product.quantity }
      : { name: '', sku: '', price: '', quantity: '' },
  })

  const onSubmit = async (data) => {
    try {
      if (isEdit) {
        await update.mutateAsync({ id: product.id, data })
        toast({ title: 'Product updated', variant: 'success' })
      } else {
        await create.mutateAsync(data)
        toast({ title: 'Product created', variant: 'success' })
        reset()
      }
      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      toast({ title: 'Error', description: err.userMessage ?? 'Operation failed', variant: 'destructive' })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="product-form">
          <div className="space-y-1.5">
            <Label htmlFor="prod-name">Product Name</Label>
            <Input id="prod-name" placeholder="e.g. Widget Pro" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="prod-sku">SKU</Label>
            <Input id="prod-sku" placeholder="e.g. WGT-001" {...register('sku')} />
            {errors.sku && <p className="text-xs text-destructive">{errors.sku.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="prod-price">Price (USD)</Label>
              <Input id="prod-price" type="number" step="0.01" placeholder="0.00" {...register('price')} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="prod-qty">Quantity</Label>
              <Input id="prod-qty" type="number" placeholder="0" {...register('quantity')} />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
            </div>
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} id="btn-product-submit">
              {isSubmitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  )
}

export function ProductsPage() {
  const { toast } = useToast()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [sort, setSort] = useState('created_at')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data, isLoading, isFetching } = useProducts({ page, limit: 10, search, sort })
  const deleteProduct = useDeleteProduct()

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
      await deleteProduct.mutateAsync(deleteTarget.id)
      toast({ title: 'Product deleted', variant: 'success' })
      setDeleteTarget(null)
    } catch (err) {
      toast({ title: 'Error', description: err.userMessage, variant: 'destructive' })
    }
  }

  const products = data?.items ?? []
  const total = data?.total ?? 0
  const pages = data?.pages ?? 1

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${total.toLocaleString()} product${total !== 1 ? 's' : ''} in catalog`}
        actions={
          <Button onClick={() => { setEditProduct(null); setDialogOpen(true) }} id="btn-add-product">
            <Plus className="w-4 h-4" />
            Add Product
          </Button>
        }
      />

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="product-search"
            placeholder="Search by name or SKU…"
            value={searchInput}
            onChange={handleSearchChange}
            className="pl-9"
          />
        </div>
        <select
          id="product-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="h-9 rounded-md border border-input bg-transparent px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="created_at">Newest</option>
          <option value="name">Name A-Z</option>
          <option value="price">Price</option>
          <option value="quantity">Stock</option>
        </select>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Products table">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">SKU</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Price</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Stock</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden lg:table-cell">Created</th>
                <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6}><TableSkeleton /></td></tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={Package}
                      title="No products found"
                      description={search ? 'Try a different search term.' : 'Add your first product to get started.'}
                      action={
                        !search && (
                          <Button size="sm" onClick={() => setDialogOpen(true)} id="btn-add-first-product">
                            <Plus className="w-4 h-4" /> Add Product
                          </Button>
                        )
                      }
                    />
                  </td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr
                    key={product.id}
                    className={`hover:bg-muted/20 transition-colors ${isFetching ? 'opacity-70' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded">
                        {product.sku}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-semibold tabular-nums ${getStockColor(product.quantity)}`}>
                        {product.quantity.toLocaleString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                      {formatDate(product.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          aria-label="Edit product"
                          id={`btn-edit-product-${product.id}`}
                          onClick={() => { setEditProduct(product); setDialogOpen(true) }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          aria-label="Delete product"
                          id={`btn-delete-product-${product.id}`}
                          onClick={() => setDeleteTarget(product)}
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

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Page {page} of {pages} ({total.toLocaleString()} total)
            </p>
            <div className="flex items-center gap-2">
              <Button
                size="icon-sm"
                variant="outline"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                id="btn-prev-page-products"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                size="icon-sm"
                variant="outline"
                disabled={page === pages}
                onClick={() => setPage((p) => p + 1)}
                id="btn-next-page-products"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Form Dialog */}
      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editProduct}
      />

      {/* Confirm Delete */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
        confirmLabel="Delete Product"
        onConfirm={handleDelete}
        loading={deleteProduct.isPending}
      />
    </div>
  )
}
