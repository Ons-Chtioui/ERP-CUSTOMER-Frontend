export interface KpiResult {
  ca: number;
  orderCount: number;
  lowStockCount: number;
  overdueInvoiceCount: number;
  totalUnpaid: number;
  quoteCount: number;
  invoiceCount: number;
}

export interface MonthlyCaItem {
  month: string;
  ca: number;
  count: number;
}

export interface TopProductItem {
  productId: number;
  name: string;
  reference: string;
  totalQty: number;
  totalHt: number;
}

export interface StockStatusItem {
  id: number;
  name: string;
  reference: string;
  quantiteDisponible: number;
  stockMinimum: number;
  prixAchat: number;
  status: 'rupture' | 'critique' | 'faible' | 'normal';
}

export interface OrdersByStatusItem {
  status: string;
  count: number;
  total: number;
}

export interface WarehousePerformanceItem {
  warehouseId: number;
  warehouseName: string;
  componentCount: number;
  stockValue: number;
}

export interface Rolling12MonthItem {
  month: string;
  ca: number;
}

export interface DashboardData {
  kpis: KpiResult;
  monthlyCa: MonthlyCaItem[];
  topProducts: TopProductItem[];
  stockStatus: StockStatusItem[];
  ordersByStatus: OrdersByStatusItem[];
  warehousePerformance: WarehousePerformanceItem[];
  rolling12Months: Rolling12MonthItem[];
}