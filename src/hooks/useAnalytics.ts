// src/hooks/useAnalytics.ts
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  KpiResult,
  MonthlyCaItem,
  TopProductItem,
  StockStatusItem,
  OrdersByStatusItem,
  WarehousePerformanceItem,
  Rolling12MonthItem,
} from '@/types/analytics';

// ── Re-export des types pour usage dans les composants ──────────
export type {
  KpiResult, MonthlyCaItem, TopProductItem,
  StockStatusItem, OrdersByStatusItem,
  WarehousePerformanceItem, Rolling12MonthItem,
};

// ── KPIs principaux ─────────────────────────────────────────────
export const useKpis = (year?: number) =>
  useQuery<KpiResult>({
    queryKey: ['analytics', 'kpis', year],
    queryFn:  () => api.get(`/analytics/kpis${year ? `?year=${year}` : ''}`).then(r => r.data),
    staleTime: 60_000,
  });

// ── CA mensuel ──────────────────────────────────────────────────
export const useMonthlyCa = (year?: number) =>
  useQuery<MonthlyCaItem[]>({
    queryKey: ['analytics', 'monthly-ca', year],
    queryFn:  () => api.get(`/analytics/monthly-ca${year ? `?year=${year}` : ''}`).then(r => r.data),
    staleTime: 60_000,
  });

// ── Top produits ────────────────────────────────────────────────
export const useTopProducts = (limit = 10, year?: number) =>
  useQuery<TopProductItem[]>({
    queryKey: ['analytics', 'top-products', limit, year],
    queryFn:  () =>
      api.get(`/analytics/top-products?limit=${limit}${year ? `&year=${year}` : ''}`).then(r => r.data),
    staleTime: 60_000,
  });

// ── État stock composants ────────────────────────────────────────
export const useStockStatus = () =>
  useQuery<StockStatusItem[]>({
    queryKey: ['analytics', 'stock-status'],
    queryFn:  () => api.get('/analytics/stock-status').then(r => r.data),
    staleTime: 30_000,
  });

// ── Commandes par statut ────────────────────────────────────────
export const useOrdersByStatus = () =>
  useQuery<OrdersByStatusItem[]>({
    queryKey: ['analytics', 'orders-by-status'],
    queryFn:  () => api.get('/analytics/orders-by-status').then(r => r.data),
    staleTime: 60_000,
  });

// ── Performance entrepôts ───────────────────────────────────────
export const useWarehousePerformance = () =>
  useQuery<WarehousePerformanceItem[]>({
    queryKey: ['analytics', 'warehouse-performance'],
    queryFn:  () => api.get('/analytics/warehouse-performance').then(r => r.data),
    staleTime: 60_000,
  });

// ── CA glissant 12 mois ─────────────────────────────────────────
export const useRolling12Months = () =>
  useQuery<Rolling12MonthItem[]>({
    queryKey: ['analytics', 'rolling-12-months'],
    queryFn:  () => api.get('/analytics/rolling-12-months').then(r => r.data),
    staleTime: 60_000,
  });

// ── Hook combiné pour le dashboard (appels parallèles) ──────────
export const useDashboardAnalytics = (year?: number) => {
  const kpis             = useKpis(year);
  const monthlyCa        = useMonthlyCa(year);
  const topProducts      = useTopProducts(10, year);
  const stockStatus      = useStockStatus();
  const ordersByStatus   = useOrdersByStatus();
  const warehousePerf    = useWarehousePerformance();
  const rolling12        = useRolling12Months();

  const isLoading = [kpis, monthlyCa, topProducts, stockStatus,
    ordersByStatus, warehousePerf, rolling12].some(q => q.isLoading);
  const isError   = [kpis, monthlyCa, topProducts, stockStatus,
    ordersByStatus, warehousePerf, rolling12].some(q => q.isError);

  return {
    isLoading,
    isError,
    kpis:            kpis.data,
    monthlyCa:       monthlyCa.data ?? [],
    topProducts:     topProducts.data ?? [],
    stockStatus:     stockStatus.data ?? [],
    ordersByStatus:  ordersByStatus.data ?? [],
    warehousePerf:   warehousePerf.data ?? [],
    rolling12:       rolling12.data ?? [],
    refetch: () => {
      kpis.refetch();
      monthlyCa.refetch();
      topProducts.refetch();
      stockStatus.refetch();
      ordersByStatus.refetch();
      warehousePerf.refetch();
      rolling12.refetch();
    },
  };
};