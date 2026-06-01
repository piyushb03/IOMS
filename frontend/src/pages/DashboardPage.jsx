import { Package, Users, ShoppingCart, AlertTriangle } from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { useDashboard } from '@/hooks/useDashboard'
import { useProducts } from '@/hooks/useProducts'
import { useOrders } from '@/hooks/useOrders'
import { StatsCard } from '@/components/shared/StatsCard'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, getStockColor } from '@/lib/utils'

const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className="text-sm font-semibold" style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  )
}

export function DashboardPage() {
  const { data: summary, isLoading: summaryLoading } = useDashboard()
  const { data: productsData } = useProducts({ limit: 5, sort: 'quantity' })
  const { data: ordersData } = useOrders({ limit: 7 })

  // Build inventory chart data from low stock products
  const inventoryChartData = productsData?.items?.slice(0, 6).map((p) => ({
    name: p.name.length > 12 ? `${p.name.slice(0, 12)}…` : p.name,
    stock: p.quantity,
  })) ?? []

  // Build orders status pie data
  const orderStatusCounts = (ordersData?.items ?? []).reduce((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1
    return acc
  }, {})
  const pieData = Object.entries(orderStatusCounts).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatsCard
          title="Total Products"
          value={summary?.total_products ?? 0}
          subtitle="In catalog"
          icon={Package}
          color="primary"
          loading={summaryLoading}
        />
        <StatsCard
          title="Total Customers"
          value={summary?.total_customers ?? 0}
          subtitle="Registered users"
          icon={Users}
          color="success"
          loading={summaryLoading}
        />
        <StatsCard
          title="Total Orders"
          value={summary?.total_orders ?? 0}
          subtitle="All time"
          icon={ShoppingCart}
          color="warning"
          loading={summaryLoading}
        />
        <StatsCard
          title="Low Stock Items"
          value={summary?.low_stock_products ?? 0}
          subtitle="≤10 units remaining"
          icon={AlertTriangle}
          color="destructive"
          loading={summaryLoading}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Inventory Overview</CardTitle>
            <CardDescription>Stock levels for lowest inventory products</CardDescription>
          </CardHeader>
          <CardContent>
            {inventoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={inventoryChartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 3.7% 15.9%)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: 'hsl(240 5% 64.9%)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(240 5% 64.9%)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="stock" fill="hsl(239 84% 67%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-sm text-muted-foreground">
                No product data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Orders Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Orders Overview</CardTitle>
            <CardDescription>Order status distribution (recent)</CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={(value) => (
                      <span style={{ color: 'hsl(240 5% 64.9%)', fontSize: 12 }}>
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-60 flex items-center justify-center text-sm text-muted-foreground">
                No order data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low stock table */}
      {(productsData?.items?.filter((p) => p.quantity <= 10) ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Low Stock Alert
            </CardTitle>
            <CardDescription>Products with ≤10 units in stock</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {productsData.items
                .filter((p) => p.quantity <= 10)
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">
                        {formatCurrency(p.price)}
                      </span>
                      <Badge
                        variant={p.quantity === 0 ? 'destructive' : 'warning'}
                        className="font-mono"
                      >
                        {p.quantity} units
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
