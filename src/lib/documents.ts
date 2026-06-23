import api from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL;

/** Ouvre un PDF dans un nouvel onglet (avec auth via blob) */
export async function downloadPdf(path: string, filename?: string) {
  const response = await api.get(path, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  if (filename) a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const pdfPaths = {
  quote:       (id: string | number) => `/documents/quotes/${id}/pdf`,
  invoice:     (id: string | number) => `/documents/invoices/${id}/pdf`,
  deliveryNote:(id: string | number) => `/documents/delivery-notes/${id}/pdf`,
  order:       (id: string | number) => `/documents/orders/${id}/pdf`,
  inventory:   (id: string | number) => `/documents/inventory/${id}/pdf`,
};

export async function exportDashboardCsv(type: 'dashboard' | 'orders' | 'invoices' = 'dashboard') {
  const response = await api.get(`/dashboard/export?type=${type}&format=csv`, { responseType: 'blob' });
  const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${type}-export.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
