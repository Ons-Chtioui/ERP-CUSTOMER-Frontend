export interface Warehouse {
  id: number;
  nom: string;
  code: string;
  adresse?: string;
  ville?: string;
  pays: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: number;
  nom: string;
  description?: string;
}

export interface Supplier {
  id: number;
  nom: string;
  code?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  pays?: string;
  isActive: boolean;
}

export interface Component {
  id: number;
  nom: string;
  reference: string;
  description?: string;
  unite: string;
  category?: Category;
  supplier?: Supplier;
  /** Prix d'achat en Dinar Tunisien */
  prixAchat: number | string;
  /** Prix de vente en Dinar Tunisien */
  prixVente: number | string;
  seuilAlerte: number | string;
  barcode?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryItem {
  id: number;
  component: Component;
  warehouse: Warehouse;
  quantity: number;
  reservedQty: number;
  available: number;
}

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER';

export interface StockMovement {
  id: number;
  type: MovementType;
  quantity: number;
  quantityAfter: number;
  quantityBefore: number;
  referenceDoc?: string;
  notes?: string;
  component: Component;
  warehouse: Warehouse;
  targetWarehouse?: Warehouse;
  user?: { id: number; prenom: string; nom: string } | null;
  createdAt: Date;
}

export interface StockAlert {
  id: number;
  warehouse: Warehouse;
  component: Component;
  quantityAtAlert: number;
  threshold: number;
  status: 'active' | 'resolved';
  createdAt: Date;
}

export interface InventorySession {
  id: number;
  nom?: string;
  status: 'draft' | 'in_progress' | 'closed';
  warehouse: Warehouse;
  user?: { id: number; prenom: string; nom: string };
  startedAt?: string | null;
  closedAt?: string | null;
  notes?: string;
  lines?: InventoryLine[];
  createdAt: string;
}

export interface InventoryLine {
  id: number;
  component: Component;
  quantityTheoretical: number;
  quantityCounted: number | null;
  ecart: number | null;
  notes?: string;
  countedAt?: string | null;
}
