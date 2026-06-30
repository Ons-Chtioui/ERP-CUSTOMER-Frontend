'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Camera, Image as ImageIcon, X,
  Loader2, Package, AlertCircle, CheckCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { mediaUrl } from '@/lib/media';
import type { Component } from '@/types/stock';

type Mode = 'manual' | 'camera' | 'image';

interface BarcodeLookupProps {
  /** appelé quand un composant est trouvé — sinon navigue vers /components/:id */
  onFound?: (component: Component) => void;
  /** classe CSS supplémentaire */
  className?: string;
}

export function BarcodeLookup({ onFound, className }: BarcodeLookupProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('manual');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [found, setFound] = useState<Component | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<import('@zxing/browser').BrowserMultiFormatReader | null>(null);

  // ── Recherche par code ──────────────────────────────────────────
  const lookup = useCallback(async (code: string) => {
    const clean = code.trim();
    if (!clean) return;
    setLoading(true);
    setError('');
    setFound(null);
    try {
      const { data } = await api.get<Component>(`/components/barcode/${clean}`);
      setFound(data);
      setInput(clean);
      if (onFound) {
        onFound(data);
      }
    } catch {
      setError(`Aucun composant trouvé pour "${clean}"`);
    } finally {
      setLoading(false);
    }
  }, [onFound]);

  // ── Mode manuel : submit ────────────────────────────────────────
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lookup(input);
  };

  // ── Mode caméra ─────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setError('');
    setCameraActive(true);
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();
      scannerRef.current = reader;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        reader.decodeFromVideoElement(videoRef.current, (result, err) => {
          if (result) {
            stopCamera();
            lookup(result.getText());
          }
        });
      }
    } catch {
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
      setCameraActive(false);
    }
  }, [lookup]);

  const stopCamera = useCallback(() => {
    (scannerRef.current as any)?.reset();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    scannerRef.current = null;
    setCameraActive(false);
  }, []);

  useEffect(() => {
    if (mode === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode]);

  // ── Mode image ──────────────────────────────────────────────────
  const handleImageFile = async (file: File) => {
    setLoading(true);
    setError('');
    setFound(null);
    try {
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      const reader = new BrowserMultiFormatReader();
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.src = url;
      await new Promise<void>((res, rej) => {
        img.onload = () => res();
        img.onerror = () => rej(new Error('Erreur chargement image'));
      });
      const result = await reader.decodeFromImageElement(img);
      URL.revokeObjectURL(url);
      await lookup(result.getText());
    } catch {
      setError('Aucun code-barres lisible dans cette image');
      setLoading(false);
    }
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleImageFile(file);
  };

  const tabClass = (t: Mode) =>
    cn(
      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
      mode === t
        ? 'bg-indigo-600 text-white'
        : 'text-gray-400 hover:text-white hover:bg-gray-800',
    );

  return (
    <div className={cn('bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden', className)}>
      {/* En-tête + onglets */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <p className="text-white text-sm font-medium flex items-center gap-2">
          <Search className="w-4 h-4 text-indigo-400" />
          Recherche par code-barres
        </p>
        <div className="flex gap-1">
          <button onClick={() => setMode('manual')} className={tabClass('manual')} title="Saisie manuelle">
            <Search className="w-3.5 h-3.5" /> Manuel
          </button>
          <button onClick={() => setMode('camera')} className={tabClass('camera')} title="Scanner via caméra">
            <Camera className="w-3.5 h-3.5" /> Caméra
          </button>
          <button onClick={() => setMode('image')} className={tabClass('image')} title="Lire depuis une image">
            <ImageIcon className="w-3.5 h-3.5" /> Image
          </button>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* ── Mode manuel ──────────────────────────────────────── */}
        {mode === 'manual' && (
          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(''); setFound(null); }}
              placeholder="Saisir ou scanner le code-barres..."
              autoFocus
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm rounded-lg transition-colors"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            </button>
          </form>
        )}

        {/* ── Mode caméra ──────────────────────────────────────── */}
        {mode === 'camera' && (
          <div className="space-y-2">
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              {/* Viseur */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-32 border-2 border-indigo-400 rounded-lg opacity-80">
                  <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-indigo-400 rounded-tl-lg" />
                  <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-indigo-400 rounded-tr-lg" />
                  <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-indigo-400 rounded-bl-lg" />
                  <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-indigo-400 rounded-br-lg" />
                </div>
              </div>
              {loading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
              )}
            </div>
            <p className="text-gray-500 text-xs text-center">
              Pointez la caméra vers le code-barres — détection automatique
            </p>
          </div>
        )}

        {/* ── Mode image ───────────────────────────────────────── */}
        {mode === 'image' && (
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleImageDrop}
            className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 hover:border-indigo-500 rounded-xl p-8 cursor-pointer transition-colors text-center"
          >
            {loading ? (
              <Loader2 className="w-8 h-8 text-indigo-400 animate-spin mb-2" />
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-500 mb-2" />
            )}
            <span className="text-gray-400 text-sm">
              {loading ? 'Lecture en cours...' : 'Glisser une image ou cliquer pour sélectionner'}
            </span>
            <span className="text-gray-600 text-xs mt-1">PNG, JPG, GIF contenant un code-barres</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
              disabled={loading}
            />
          </label>
        )}

        {/* ── Résultat ─────────────────────────────────────────── */}
        {error && (
          <div className="flex items-center gap-2 bg-red-950 border border-red-800 rounded-lg px-3 py-2 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {found && (
          <div
            onClick={() => router.push(`/components/${found.id}`)}
            className="flex items-center gap-3 bg-green-950/30 border border-green-800/50 rounded-xl p-3 cursor-pointer hover:bg-green-950/50 transition-colors"
          >
            {found.imageUrl ? (
              <img src={mediaUrl(found.imageUrl)} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-700 shrink-0" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5 text-gray-500" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{found.nom}</p>
              <p className="text-gray-400 text-xs font-mono">{found.reference} · {found.barcode}</p>
            </div>
            <CheckCircle className="w-5 h-5 text-green-400 shrink-0" />
          </div>
        )}
      </div>
    </div>
  );
}
