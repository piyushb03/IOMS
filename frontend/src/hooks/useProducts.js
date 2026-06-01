import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { productsApi } from '@/api/products'

export const PRODUCTS_KEY = 'products'

export function useProducts(params) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, params],
    queryFn: () => productsApi.list(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  })
}

export function useProduct(id) {
  return useQuery({
    queryKey: [PRODUCTS_KEY, id],
    queryFn: () => productsApi.get(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => productsApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  })
}

export function useUpdateProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => productsApi.update(id, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  })
}

export function useDeleteProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => productsApi.delete(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] }),
  })
}
