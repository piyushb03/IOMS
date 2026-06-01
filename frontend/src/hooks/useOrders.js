import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ordersApi } from '@/api/orders'
import { PRODUCTS_KEY } from './useProducts'

export const ORDERS_KEY = 'orders'

export function useOrders(params) {
  return useQuery({
    queryKey: [ORDERS_KEY, params],
    queryFn: () => ordersApi.list(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  })
}

export function useOrder(id) {
  return useQuery({
    queryKey: [ORDERS_KEY, id],
    queryFn: () => ordersApi.get(id).then((r) => r.data.data),
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => ordersApi.create(data).then((r) => r.data),
    onSuccess: () => {
      // Invalidate both orders and products (inventory changed)
      qc.invalidateQueries({ queryKey: [ORDERS_KEY] })
      qc.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
    },
  })
}

export function useDeleteOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => ordersApi.delete(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [ORDERS_KEY] }),
  })
}
