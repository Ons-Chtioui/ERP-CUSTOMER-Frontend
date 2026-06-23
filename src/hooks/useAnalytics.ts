// frontend/src/hooks/useAnalytics.ts
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { KpiResult, MonthlyCaItem, TopProductItem, StockStatusItem, OrdersByStatusItem, WarehousePerformanceItem } from '@/types/analytics';

// ─── DASHBOARD ANALYTICS COMPATIBLE AVEC L'ANCIEN FORMAT ──────

export interface DashboardAnalytics {
  revenue: { paid: number; unpaid: number };
  orders: {
    byStatus: { status: string; count: number; total: number }[];
    delivered: number;
  };
  invoices: {
    byStatus: { status: string; count: number; total: number }[];
    overdue: number;
  };
  quotes: {
    byStatus: { status: string; count: number }[];
    conversionRate: number;
  };
  topProducts: {
    name: string;
    reference: string;
    quantity: number;
    revenue: number;
  }[];
  stockAlerts: {
    id: number;
    component: string;
    warehouse: string;
    quantity: number;
    threshold: number;
  }[];
  warehouses: {
    id: number;
    name: string;
    code: string;
    items: number;
    value: number;
  }[];
  monthlyRevenue: { month: string; revenue: number }[];
}

// ─── HOOK PRINCIPAL ────────────────────────────────────────────

export const useDashboardAnalytics = () =>
  useQuery<DashboardAnalytics>({
    queryKey: ['dashboard', 'analytics'],
    queryFn: async () => {
      // Appels parallèles vers l'API Analytics
      const [
        kpisRes,
        monthlyCaRes,
        topProductsRes,
        stockStatusRes,
        ordersByStatusRes,
        warehousePerformanceRes,
      ] = await Promise.all([
        api.get('/analytics/kpis'),
        api.get('/analytics/monthly-ca'),
        api.get('/analytics/top-products?limit=10'),
        api.get('/analytics/stock-status'),
        api.get('/analytics/orders-by-status'),
        api.get('/analytics/warehouse-performance'),
      ]);

      const kpis: KpiResult = kpisRes.data;
      const monthlyCa: MonthlyCaItem[] = monthlyCaRes.data;
      const topProducts: TopProductItem[] = topProductsRes.data;
      const stockStatus: StockStatusItem[] = stockStatusRes.data;
      const ordersByStatus: OrdersByStatusItem[] = ordersByStatusRes.data;
      const warehousePerformance: WarehousePerformanceItem[] = warehousePerformanceRes.data;

      // Transformer les données au format attendu par le dashboard
      return {
        revenue: {
          paid: kpis.ca,
          unpaid: kpis.totalUnpaid,
        },
        orders: {
          byStatus: ordersByStatus.map(s => ({
            status: s.status,
            count: s.count,
            total: s.total,
          })),
          delivered: ordersByStatus.find(s => s.status === 'delivered')?.count || 0,
        },
        invoices: {
          byStatus: [
            { status: 'paid', count: kpis.invoiceCount, total: kpis.ca },
            { status: 'overdue', count: kpis.overdueInvoiceCount, total: 0 },
          ],
          overdue: kpis.overdueInvoiceCount,
        },
        quotes: {
          byStatus: [
            { status: 'sent', count: kpis.quoteCount },
            { status: 'converted', count: Math.round(kpis.quoteCount * 0.3) }, // Estimation
          ],
          conversionRate: kpis.quoteCount > 0 ? Math.round((kpis.invoiceCount / kpis.quoteCount) * 100) : 0,
        },
        topProducts: topProducts.map(p => ({
          name: p.name,
          reference: p.reference,
          quantity: p.totalQty,
          revenue: p.totalHt,
        })),
        stockAlerts: stockStatus
          .filter(s => s.status === 'rupture' || s.status === 'critique')
          .map(s => ({
            id: s.id,
            component: s.name,
            warehouse: 'Entrepôt principal',
            quantity: s.quantiteDisponible,
            threshold: s.stockMinimum,
          })),
        warehouses: warehousePerformance.map(w => ({
          id: w.warehouseId,
          name: w.warehouseName,
          code: `WH-${w.warehouseId}`,
          items: w.componentCount,
          value: w.stockValue,
        })),
        monthlyRevenue: monthlyCa.map(m => ({
          month: m.month,
          revenue: m.ca,
        })),
      };
    },
    staleTime: 60_000, // 1 minute
    refetchInterval: 60_000, // Rafraîchir toutes les minutes
  });