'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Loader2, ArrowLeft, Package, Building2, Tag, AlertTriangle, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import type { Category, Supplier } from '@/types/stock';

const componentSchema = z.object({
  nom: z.string().min(2, 'Le nom est requis').max(150),
  reference: z
    .string()
    .min(2, 'La référence est requise')
    .max(80)
    .regex(/^[A-Z0-9-_]+$/, 'Majuscules, chiffres, tirets uniquement'),
  description: z.string().optional(),
  unite: z.string().max(20).default('unité'),
  prixAchat: z.coerce.number().min(0, 'Prix positif requis').default(0),
  prixVente: z.coerce.number().min(0, 'Prix positif requis').default(0),
  seuilAlerte: z.coerce.number().int().min(0).default(0),
  barcode: z
    .string()
    .max(100)
    .regex(/^[0-9]*$/, 'Chiffres uniquement')
    .optional()
    .or(z.literal('')),
  categoryId: z.coerce.number().optional(),
  supplierId: z.coerce.number().optional(),
});

type ComponentFormData = z.infer<typeof componentSchema>;

// ─── Mini-modal création rapide ───────────────────────────────────────────────
function QuickCreateModal({
  title,
  fields,
  onSubmit,
  onClose,
  loading,
}: {
  title: string;
  fields: { name: string; label: string; required?: boolean; type?: string }[];
  onSubmit: (data: Record<string, string>) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="text-white font-semibold mb-4">{title}</h3>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.name}>
              <label className="block text-sm text-gray-300 mb-1">
                {f.label} {f.required && <span className="text-red-400">*</span>}
              </label>
              {f.type === 'textarea' ? (
                <textarea
                  value={values[f.name] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  rows={2}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
                />
              ) : (
                <input
                  type={f.type ?? 'text'}
                  value={values[f.name] ?? ''}
                  onChange={(e) => setValues((v) => ({ ...v, [f.name]: e.target.value }))}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors">
            Annuler
          </button>
          <button
            onClick={() => onSubmit(values)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-sm rounded-lg transition-colors"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Créer
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function EditComponentPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const componentId = parseInt(params.id as string);
  const [error, setError] = useState('');
  const [showCatModal, setShowCatModal] = useState(false);
  const [showSupModal, setShowSupModal] = useState(false);

  const { data: component, isLoading: loadingComp } = useQuery({
    queryKey: ['component', componentId],
    queryFn: () => api.get(`/components/${componentId}`).then((r) => r.data),
    enabled: !!componentId,
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/components/categories').then((r) => r.data),
  });

  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/components/suppliers').then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ComponentFormData>({ resolver: zodResolver(componentSchema) });

  useEffect(() => {
    if (component) {
      reset({
        nom: component.nom,
        reference: component.reference,
        description: component.description ?? '',
        unite: component.unite ?? 'unité',
        prixAchat: Number(component.prixAchat) || 0,
        prixVente: Number(component.prixVente) || 0,
        seuilAlerte: Number(component.seuilAlerte) || 0,
        barcode: component.barcode ?? '',
        categoryId: component.category?.id,
        supplierId: component.supplier?.id,
      });
    }
  }, [component, reset]);

  // ── Mutations création catégorie / fournisseur ────────────────
  const catMutation = useMutation({
    mutationFn: (data: { nom: string; description?: string }) =>
      api.post('/components/categories', data).then((r) => r.data),
    onSuccess: (cat: Category) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setValue('categoryId', cat.id);
      setShowCatModal(false);
    },
  });

  const supMutation = useMutation({
    mutationFn: (data: Record<string, string>) =>
      api.post('/components/suppliers', data).then((r) => r.data),
    onSuccess: (sup: Supplier) => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      setValue('supplierId', sup.id);
      setShowSupModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ComponentFormData) =>
      api.put(`/components/${componentId}`, {
        ...data,
        barcode: data.barcode?.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
      queryClient.invalidateQueries({ queryKey: ['component', componentId] });
      router.push(`/components/${componentId}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })
        ?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Erreur lors de la modification');
    },
  });

  const inputClass = (hasError: boolean) =>
    cn(
      'w-full bg-gray-800 border rounded-lg px-3 py-2 text-white text-sm',
      'focus:outline-none focus:ring-1 transition-colors',
      hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500',
    );

  if (loadingComp) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white">Modifier le composant</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            {component?.nom} — <span className="font-mono">{component?.reference}</span>
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))} className="space-y-6" noValidate>

        {/* ── Informations générales ───────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-medium flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-400" />
            Informations générales
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nom <span className="text-red-400">*</span></label>
              <input {...register('nom')} className={inputClass(!!errors.nom)} />
              {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Référence <span className="text-red-400">*</span></label>
              <input {...register('reference')} className={cn(inputClass(!!errors.reference), 'font-mono uppercase')} />
              {errors.reference && <p className="text-red-400 text-xs mt-1">{errors.reference.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea {...register('description')} rows={3} className={cn(inputClass(false), 'resize-none')} />
          </div>
        </div>

        {/* ── Prix & caractéristiques ──────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-medium flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-400" />
            Prix & caractéristiques
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Prix d'achat (DTN)</label>
              <input {...register('prixAchat')} type="number" step="0.001" min="0" className={inputClass(!!errors.prixAchat)} />
              {errors.prixAchat && <p className="text-red-400 text-xs mt-1">{errors.prixAchat.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Prix de vente (DTN)</label>
              <input {...register('prixVente')} type="number" step="0.001" min="0" className={inputClass(!!errors.prixVente)} />
              {errors.prixVente && <p className="text-red-400 text-xs mt-1">{errors.prixVente.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Unité</label>
              <select {...register('unite')} className={inputClass(false)}>
                <option value="unité">Unité</option>
                <option value="kg">Kilogramme (kg)</option>
                <option value="g">Gramme (g)</option>
                <option value="mètre">Mètre (m)</option>
                <option value="cm">Centimètre (cm)</option>
                <option value="litre">Litre (L)</option>
                <option value="rouleau">Rouleau</option>
                <option value="paquet">Paquet</option>
                <option value="boîte">Boîte</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Seuil d'alerte <AlertTriangle className="w-3 h-3 inline text-orange-400 ml-1" />
              </label>
              <input {...register('seuilAlerte')} type="number" step="1" min="0" className={inputClass(!!errors.seuilAlerte)} />
              <p className="text-gray-500 text-xs mt-1">Déclenche une alerte si stock ≤ valeur</p>
            </div>
          </div>

          {/* Code-barres */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Code-barres
              <span className="ml-2 text-xs text-gray-500 font-normal">(laisser vide pour conserver l'actuel)</span>
            </label>
            <div className="relative">
              <input
                {...register('barcode')}
                type="text"
                inputMode="numeric"
                placeholder="Code EAN-13 en chiffres"
                className={cn(inputClass(!!errors.barcode), 'font-mono pr-24')}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded">
                EAN-13
              </span>
            </div>
            {errors.barcode && <p className="text-red-400 text-xs mt-1">{errors.barcode.message}</p>}
          </div>
        </div>

        {/* ── Classification ───────────────────────────────────── */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            Classification
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-300">Catégorie</label>
                <button type="button" onClick={() => setShowCatModal(true)} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                  <Plus className="w-3 h-3" /> Nouvelle
                </button>
              </div>
              <select {...register('categoryId')} className={inputClass(false)}>
                <option value="">-- Sélectionner --</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-300">Fournisseur</label>
                <button type="button" onClick={() => setShowSupModal(true)} className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300">
                  <Plus className="w-3 h-3" /> Nouveau
                </button>
              </div>
              <select {...register('supplierId')} className={inputClass(false)}>
                <option value="">-- Sélectionner --</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.nom}</option>)}
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="text-lg leading-none ml-4">×</button>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors">
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting || updateMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {(isSubmitting || updateMutation.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
            Enregistrer les modifications
          </button>
        </div>
      </form>

      {showCatModal && (
        <QuickCreateModal
          title="Nouvelle catégorie"
          fields={[
            { name: 'nom', label: 'Nom', required: true },
            { name: 'description', label: 'Description', type: 'textarea' },
          ]}
          onSubmit={(data) => catMutation.mutate({ nom: data.nom, description: data.description })}
          onClose={() => setShowCatModal(false)}
          loading={catMutation.isPending}
        />
      )}

      {showSupModal && (
        <QuickCreateModal
          title="Nouveau fournisseur"
          fields={[
            { name: 'nom', label: 'Nom', required: true },
            { name: 'email', label: 'Email', type: 'email' },
            { name: 'telephone', label: 'Téléphone' },
            { name: 'adresse', label: 'Adresse', type: 'textarea' },
            { name: 'pays', label: 'Pays' },
          ]}
          onSubmit={(data) => supMutation.mutate(data)}
          onClose={() => setShowSupModal(false)}
          loading={supMutation.isPending}
        />
      )}
    </div>
  );
}
