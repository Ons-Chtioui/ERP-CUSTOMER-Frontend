// frontend/src/hooks/useExport.ts
import { useState, useCallback } from 'react';
import {
  downloadExport,
  downloadMonthlyCA,
  downloadTopProducts,
  downloadDashboard,
  ExportType,
  ExportResult,
} from '@/lib/export'; // ✅ CORRIGÉ : import de @/lib/export

interface UseExportOptions {
  year?: number;
  onSuccess?: (result: ExportResult) => void;
  onError?: (error: string) => void;
}

interface UseExportReturn {
  loading: boolean;
  error: string | null;
  lastResult: ExportResult | null;
  exportData: (type: ExportType) => Promise<ExportResult>;
  exportMonthlyCA: () => Promise<ExportResult>;
  exportTopProducts: () => Promise<ExportResult>;
  exportDashboard: () => Promise<ExportResult>;
  exportAll: () => Promise<ExportResult[]>;
  reset: () => void;
}

export function useExport(options: UseExportOptions = {}): UseExportReturn {
  const { year, onSuccess, onError } = options;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ExportResult | null>(null);

  const handleExport = useCallback(
    async (type: ExportType): Promise<ExportResult> => {
      setLoading(true);
      setError(null);

      try {
        const result = await downloadExport({ type, year });
        setLastResult(result);

        if (result.success) {
          onSuccess?.(result);
        } else {
          setError(result.error || 'Export échoué');
          onError?.(result.error || 'Export échoué');
        }

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
        setError(errorMessage);
        onError?.(errorMessage);
        return {
          success: false,
          filename: '',
          error: errorMessage,
        };
      } finally {
        setLoading(false);
      }
    },
    [year, onSuccess, onError]
  );

  // ─── Exports spécifiques ──────────────────────────────────────

  const exportMonthlyCA = useCallback(() => handleExport('monthly-ca'), [handleExport]);

  const exportTopProducts = useCallback(() => handleExport('top-products'), [handleExport]);

  const exportDashboard = useCallback(() => handleExport('dashboard'), [handleExport]);

  const exportAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const results: ExportResult[] = [];
      const types: ExportType[] = ['monthly-ca', 'top-products', 'dashboard'];

      for (const type of types) {
        const result = await downloadExport({ type, year });
        results.push(result);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      setLastResult(results[results.length - 1] || null);

      const successCount = results.filter((r) => r.success).length;
      if (successCount === results.length) {
        onSuccess?.(results[0]);
      } else {
        setError(`${successCount}/${results.length} exports réussis`);
        onError?.(`${successCount}/${results.length} exports réussis`);
      }

      return results;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      onError?.(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [year, onSuccess, onError]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setLastResult(null);
  }, []);

  return {
    loading,
    error,
    lastResult,
    exportData: handleExport,
    exportMonthlyCA,
    exportTopProducts,
    exportDashboard,
    exportAll,
    reset,
  };
}