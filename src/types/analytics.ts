// src/types/analytics.ts
// Types correspondant exactement aux interfaces backend (analytics.interface.ts)

export interface KpiResult {
  ca:                   number; // CA encaissé de l'année
  orderCount:           number; // Commandes confirmées
  lowStockCount:        number; // Composants en stock critique
  overdueInvoiceCount:  number; // Factures en retard
  totalUnpaid:          number; // Montant impayé total
  quoteCount:           number; // Nb devis de l'année
  invoiceCount:         number; // Nb factures payées
}

export interface MonthlyCaItem {
  month: string;  // ex: "Jan", "Fév"
  ca:    number;
  count: number;  // nb factures du mois
}

export interface TopProductItem {
  productId: number;
  name:      string;
  reference: string;
  totalQty:  number;
  totalHt:   number;
}

export interface StockStatusItem {
  id:                 number;
  name:               string;
  reference:          string;
  quantiteDisponible: number;
  stockMinimum:       number;
  prixAchat:          number;
  status:             'rupture' | 'critique' | 'faible' | 'normal';
}

export interface OrdersByStatusItem {
  status: string;
  count:  number;
  total:  number;
}

export interface WarehousePerformanceItem {
  warehouseId:    number;
  warehouseName:  string;
  componentCount: number;
  stockValue:     number;
}

export interface Rolling12MonthItem {
  month: string;  // ex: "2024-01"
  ca:    number;
}