// frontend/src/lib/export.ts
import api from './api';
import { toast } from 'react-hot-toast';

// ─── TYPES ──────────────────────────────────────────────────────────

export type ExportType = 'monthly-ca' | 'top-products' | 'dashboard';

export interface ExportOptions {
  type: ExportType;
  year?: number;
  filename?: string;
}

export interface ExportResult {
  success: boolean;
  filename: string;
  size?: number;
  error?: string;
}

// ─── CONFIGURATION ──────────────────────────────────────────────────

const EXPORT_CONFIG: Record<ExportType, { endpoint: string; defaultFilename: string; label: string }> = {
  'monthly-ca': {
    endpoint: '/analytics/export/monthly-ca',
    defaultFilename: 'ca-mensuel',
    label: 'CA Mensuel',
  },
  'top-products': {
    endpoint: '/analytics/export/top-products',
    defaultFilename: 'top-produits',
    label: 'Top Produits',
  },
  'dashboard': {
    endpoint: '/analytics/export/dashboard',
    defaultFilename: 'dashboard',
    label: 'Dashboard complet',
  },
};

// ─── EXPORT PRINCIPAL ─────────────────────────────────────────────

/**
 * Télécharge un fichier Excel (.xlsx) depuis l'API Analytics
 */
export async function downloadExport({
  type,
  year,
  filename,
}: ExportOptions): Promise<ExportResult> {
  const config = EXPORT_CONFIG[type];
  const currentYear = year || new Date().getFullYear();
  const finalFilename = filename || `${config.defaultFilename}-${currentYear}.xlsx`;

  try {
    // 1. Toast de chargement
    const loadingToast = toast.loading(`📊 Génération de ${config.label}...`);

    // 2. Appel API
    const response = await api.get(`${config.endpoint}?year=${currentYear}`, {
      responseType: 'blob',
    });

    // 3. Vérification de la réponse
    if (!response.data || response.data.size === 0) {
      throw new Error('Le fichier généré est vide');
    }

    // 4. Création du blob
    const blob = new Blob([response.data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    // 5. Téléchargement
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = finalFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    // 6. Toast de succès
    toast.dismiss(loadingToast);
    toast.success(`✅ ${finalFilename} téléchargé avec succès !`);

    return {
      success: true,
      filename: finalFilename,
      size: blob.size,
    };
  } catch (error) {
    // 7. Gestion des erreurs
    const errorMessage = error instanceof Error ? error.message : 'Erreur lors du téléchargement';
    toast.error(`❌ ${errorMessage}`);
    console.error('Export error:', error);

    return {
      success: false,
      filename: finalFilename,
      error: errorMessage,
    };
  }
}

// ─── EXPORTS SPÉCIFIQUES ───────────────────────────────────────────

/**
 * Télécharger le CA mensuel
 */
export async function downloadMonthlyCA(year?: number): Promise<ExportResult> {
  return downloadExport({ type: 'monthly-ca', year });
}

/**
 * Télécharger le Top Produits
 */
export async function downloadTopProducts(year?: number): Promise<ExportResult> {
  return downloadExport({ type: 'top-products', year });
}

/**
 * Télécharger le Dashboard complet
 */
export async function downloadDashboard(year?: number): Promise<ExportResult> {
  return downloadExport({ type: 'dashboard', year });
}

// ─── EXPORT MULTIPLE ──────────────────────────────────────────────

/**
 * Télécharger tous les exports Excel en une fois
 */
export async function downloadAllExports(year?: number): Promise<ExportResult[]> {
  const results: ExportResult[] = [];
  const types: ExportType[] = ['monthly-ca', 'top-products', 'dashboard'];

  for (const type of types) {
    const result = await downloadExport({ type, year });
    results.push(result);
    // Petit délai entre chaque téléchargement
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const successCount = results.filter((r) => r.success).length;
  const totalCount = results.length;

  if (successCount === totalCount) {
    toast.success(`✅ Tous les exports (${totalCount}) ont été téléchargés !`);
  } else {
    // react-hot-toast n'a pas de toast.warning; utiliser un toast simple avec icône
    toast(`⚠️ ${successCount}/${totalCount} exports téléchargés`);
  }

  return results;
}

// ─── EXPORT CSV (Compatibilité) ──────────────────────────────────

/**
 * Exporte des données en CSV
 * @deprecated Utiliser downloadExport() pour Excel
 */
export async function exportCsv(
  type: 'dashboard' | 'orders' | 'invoices' = 'dashboard'
): Promise<void> {
  try {
    const loadingToast = toast.loading('📊 Génération du CSV...');

    const response = await api.get(
      `/dashboard/export?type=${type}&format=csv`,
      { responseType: 'blob' }
    );

    const blob = new Blob([response.data], {
      type: 'text/csv;charset=utf-8;',
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    toast.dismiss(loadingToast);
    toast.success('✅ CSV exporté avec succès !');
  } catch (error) {
    toast.error('❌ Erreur lors de l\'export CSV');
    console.error('CSV export error:', error);
    throw error;
  }
}