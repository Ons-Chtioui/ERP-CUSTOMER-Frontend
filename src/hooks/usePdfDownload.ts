// src/hooks/usePdfDownload.ts
/**
 * Hook pour gérer l'état de chargement d'un téléchargement PDF.
 * Évite les doubles-clics et affiche un spinner pendant le téléchargement.
 *
 * Usage :
 *   const { download, isPending } = usePdfDownload();
 *   <button onClick={() => download(pdfPaths.quote(id), `DEV-0001.pdf`)} disabled={isPending}>
 *     {isPending ? <Loader2 className="animate-spin" /> : <Download />} PDF
 *   </button>
 */

import { useState } from 'react';
import { downloadPdf } from '@/lib/documents';

export function usePdfDownload() {
  const [isPending, setIsPending] = useState(false);

  const download = async (path: string, filename?: string) => {
    if (isPending) return; // Empêche le double-clic
    setIsPending(true);
    try {
      await downloadPdf(path, filename);
    } finally {
      setIsPending(false);
    }
  };

  return { download, isPending };
}