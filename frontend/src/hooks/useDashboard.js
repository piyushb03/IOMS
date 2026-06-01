import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api/dashboard'

export const DASHBOARD_KEY = 'dashboard'

export function useDashboard() {
  return useQuery({
    queryKey: [DASHBOARD_KEY],
    queryFn: () => dashboardApi.getSummary().then((r) => r.data.data),
    staleTime: 60_000,
    refetchInterval: 60_000,
  })
}
