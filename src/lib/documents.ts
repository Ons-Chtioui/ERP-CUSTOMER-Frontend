// src/lib/documents.ts
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

/**
 * Télécharge un PDF depuis le backend avec gestion d'erreur et toast.
 * Retourne true si succès, false si erreur.
 *
 * FIX 1 : try/catch — avant, une erreur 404/500 plantait silencieusement
 * FIX 2 : vérification content-type — si le backend retourne du JSON d'erreur, on le détecte
 */
export async function downloadPdf(path: string, filename?: string): Promise<boolean> {
  const loadingToast = toast.loading('Génération du PDF...');
  try {
    const response = await api.get(path, { responseType: 'blob' });

    // Vérifier que c'est bien un PDF et pas un JSON d'erreur
    const rawContentType = response.headers?.['content-type'];
    const contentType =
      typeof rawContentType === 'string'
        ? rawContentType
        : Array.isArray(rawContentType)
        ? rawContentType.join(', ')
        : String(rawContentType ?? '');
    if (!contentType.includes('application/pdf')) {
      // Lire le message d'erreur depuis le blob JSON
      const text = await (response.data as Blob).text();
      let message = 'Erreur lors de la génération du PDF';
      try { message = JSON.parse(text).message ?? message; } catch { /* ignore */ }
      throw new Error(message);
    }

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.target   = '_blank';
    if (filename) a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.dismiss(loadingToast);
    toast.success('PDF téléchargé');
    return true;
  } catch (err: unknown) {
    toast.dismiss(loadingToast);
    const msg = (err as { message?: string })?.message ?? 'Impossible de générer le PDF';
    toast.error(msg);
    return false;
  }
}

/**
 * Chemins des endpoints PDF.
 * Cohérent avec DocumentsController côté backend.
 */
export const pdfPaths = {
  quote:        (id: string | number) => `/documents/quotes/${id}/pdf`,
  invoice:      (id: string | number) => `/documents/invoices/${id}/pdf`,
  deliveryNote: (id: string | number) => `/documents/delivery-notes/${id}/pdf`,
  order:        (id: string | number) => `/documents/orders/${id}/pdf`,
  inventory:    (id: string | number) => `/documents/inventory/${id}/pdf`,
};

/**
 * Export CSV depuis le module analytics.
 * FIX 3 : appelle /analytics/export (plus /dashboard/export qui n'existe plus)
 */
export async function exportCsv(
  type: 'dashboard' | 'orders' | 'invoices' = 'dashboard',
): Promise<void> {
  const loadingToast = toast.loading('Génération du CSV...');
  try {
    const response = await api.get(
      `/analytics/export?type=${type}&format=csv`,
      { responseType: 'blob' },
    );
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${type}-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.dismiss(loadingToast);
    toast.success('CSV exporté');
  } catch (err: unknown) {
    toast.dismiss(loadingToast);
    toast.error('Erreur lors de l\'export CSV');
    throw err;
  }
}

/**
 * @deprecated Utiliser exportCsv() — redirige pour compatibilité
 */
export const exportDashboardCsv = exportCsv;