import { Routes, Route } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { CustomersPage } from '@/pages/CustomersPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { Toaster } from '@/components/ui/toaster'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route
          path="/"
          element={
            <AppLayout>
              <DashboardPage />
            </AppLayout>
          }
        />
        <Route
          path="/products"
          element={
            <AppLayout>
              <ProductsPage />
            </AppLayout>
          }
        />
        <Route
          path="/customers"
          element={
            <AppLayout>
              <CustomersPage />
            </AppLayout>
          }
        />
        <Route
          path="/orders"
          element={
            <AppLayout>
              <OrdersPage />
            </AppLayout>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </ErrorBoundary>
  )
}
