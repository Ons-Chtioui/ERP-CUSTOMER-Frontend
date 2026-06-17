import type { Component } from './stock';
import type { Warehouse } from './stock';

export interface ProductCategory {
  id: number;
  nom: string;
  couleur: string;
  description?: string;
  createdAt: string;
}

export interface Product {
  id: number;
  nom: string;
  reference: string;
  description?: string;
  unite: string;
  /** Prix de vente manuel (prioritaire si > 0) */
  prixVente: number | string;
  /** Prix de vente calculé automatiquement depuis la BOM */
  prixVenteAuto: number | string;
  /** Coût de revient calculé = Σ(qte × prixAchat) + coutMO */
  coutRevient: number | string;
  coutMO: number | string;
  seuilAlerte: number;
  imageUrl?: string | null;
  isActive: boolean;
  category?: ProductCategory | null;
  parent?: Pick<Product, 'id' | 'nom' | 'reference'> | null;
  variants?: Pick<Product, 'id' | 'nom' | 'reference'>[];
  bomLines?: BomLine[];
  createdAt: string;
  updatedAt: string;
  stock?: ProductOrderStock;
}

export interface ProductOrderStock {
  stockFini: number;
  stockFabricable: number;
  stockTotal: number;
  goulot: { componentId: number; nom: string; fabricable: number } | null;
}

export interface FulfillmentPreview {
  productId: number;
  productName: string;
  quantity: number;
  stockFini: number;
  stockFabricable: number;
  stockTotal: number;
  fromStock: number;
  fromAssembly: number;
  canFulfill: boolean;
  missing: number;
  source: 'stock' | 'assembly' | 'mixed';
}

export interface BomLine {
  id: number;
  component: Component;
  quantity: number;
}

export interface ProductionLog {
  id: number;
  quantity: number;
  coutUnitaireSnapshot: number | string;
  coutTotal: number | string;
  notes?: string;
  warehouse: Warehouse;
  user?: { id: number; prenom: string; nom: string };
  producedAt: string;
}

export interface ProductInventoryItem {
  id: number;
  warehouse: Warehouse;
  quantity: number;
  updatedAt: string;
}

export interface Availability {
  stockDisponible: number;
  goulot: { componentId: number; nom: string; fabricable: number } | null;
  details: {
    componentId: number;
    nom: string;
    reference: string;
    qteBom: number;
    stockDispo: number;
    fabricable: number;
    isGoulot: boolean;
  }[];
}

export interface SimulationResult {
  canProduce: boolean;
  quantity: number;
  coutUnitaire: number;
  coutTotal: number;
  manquants: {
    componentId: number;
    nom: string;
    requis: number;
    dispo: number;
    manque: number;
  }[];
}
