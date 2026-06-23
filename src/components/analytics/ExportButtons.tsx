// frontend/src/components/analytics/ExportButtons.tsx
import { useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Can } from '@/components/auth/Can';
import { toast } from 'react-hot-toast';
import api from '@/lib/api';

interface ExportButtonsProps {
  year?: number;
}

export function ExportButtons({ year }: ExportButtonsProps) {
  const [loading, setLoading] = useState<'monthly' | 'top' | 'dashboard' | null>(null);

  const currentYear = year || new Date().getFullYear();

  const handleExport = async (type: 'monthly-ca' | 'top-products' | 'dashboard') => {
    setLoading(type as any);
    try {
      const response = await api.get(`/analytics/export/${type}?year=${currentYear}`, {
        responseType: 'blob',
      });

      const filename = `${type}-${currentYear}.xlsx`;
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`📊 ${filename} téléchargé avec succès`);
    } catch (error) {
      toast.error('Erreur lors de l\'export');
      console.error(error);
    } finally {
      setLoading(null);
    }
  };

  const getButtonLabel = (type: string) => {
    if (loading === type as any) return '⏳ Chargement...';
    switch (type) {
      case 'monthly-ca': return '📊 CA Mensuel';
      case 'top-products': return '🏆 Top Produits';
      case 'dashboard': return '📋 Dashboard complet';
      default: return 'Exporter';
    }
  };

  return (
    <Can permission="analytics.export">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleExport('monthly-ca')}
          disabled={!!loading}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4" />
          {getButtonLabel('monthly-ca')}
        </button>
        <button
          onClick={() => handleExport('top-products')}
          disabled={!!loading}
          className="flex items-center gap-2 px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition disabled:opacity-50"
        >
          <FileSpreadsheet className="w-4 h-4" />
          {getButtonLabel('top-products')}
        </button>
        <button
          onClick={() => handleExport('dashboard')}
          disabled={!!loading}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 border border-indigo-500 rounded-lg text-sm text-white transition disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {getButtonLabel('dashboard')}
        </button>
      </div>
    </Can>
  );
}