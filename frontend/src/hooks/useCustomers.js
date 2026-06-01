import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { customersApi } from '@/api/customers'

export const CUSTOMERS_KEY = 'customers'

export function useCustomers(params) {
  return useQuery({
    queryKey: [CUSTOMERS_KEY, params],
    queryFn: () => customersApi.list(params).then((r) => r.data.data),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  })
}

export function useCreateCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => customersApi.create(data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY] }),
  })
}

export function useDeleteCustomer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => customersApi.delete(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: [CUSTOMERS_KEY] }),
  })
}
