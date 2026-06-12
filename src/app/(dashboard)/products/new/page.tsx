'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Package, Tag, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateProduct } from '@/hooks/useProducts';
import { useProductCategories } from '@/hooks/useProductCategories';
import { useProducts } from '@/hooks/useProducts';

const schema = z.object({
  nom:         z.string().min(2, 'Nom requis').max(150),
  reference:   z.string().min(2, 'Référence requise').max(80).regex(/^[A-Z0-9-_]+$/, 'Majuscules, chiffres, tirets'),
  description: z.string().optional(),
  unite:       z.string().max(20).default('unité'),
  prixVente:   z.coerce.number().min(0).default(0),
  coutMO:      z.coerce.number().min(0).default(0),
  seuilAlerte: z.coerce.number().int().min(0).default(0),
  categoryId:  z.coerce.number().optional(),
  parentId:    z.coerce.number().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewProductPage() {
  const router = useRouter();
  const create = useCreateProduct();
  const { data: categories = [] } = useProductCategories();
  const { data: products = [] }   = useProducts();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { unite: 'unité', prixVente: 0, coutMO: 0, seuilAlerte: 0 },
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const product = await create.mutateAsync({
        ...data,
        categoryId: data.categoryId || undefined,
        parentId:   data.parentId   || undefined,
      });
      router.push(`/products/${product.id}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Erreur lors de la création');
    }
  };

  const inputClass = (hasError: boolean) => cn(
    'w-full bg-gray-800 border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 transition-colors',
    hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500',
  );

  // Parents possibles (produits sans parent)
  const parentProducts = products.filter(p => !p.parent);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white">Nouveau produit fini</h1>
          <p className="text-gray-400 text-sm mt-0.5">Le code-barres BOM sera géré manuellement</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        {/* Infos générales */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-medium flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-400" /> Informations générales
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nom <span className="text-red-400">*</span></label>
              <input {...register('nom')} placeholder="Chaise de bureau" className={inputClass(!!errors.nom)} />
              {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Référence <span className="text-red-400">*</span></label>
              <input {...register('reference')} placeholder="CHAISE-001" className={cn(inputClass(!!errors.reference), 'font-mono uppercase')} />
              {errors.reference && <p className="text-red-400 text-xs mt-1">{errors.reference.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea {...register('description')} rows={2} className={cn(inputClass(false), 'resize-none')} />
          </div>
        </div>

        {/* Prix */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-medium flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-400" /> Prix & coûts
          </h2>
          <p className="text-gray-500 text-xs">
            Le prix de vente auto sera calculé depuis la BOM. Saisissez un prix manuel pour le surcharger.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Prix vente manuel (DTN)</label>
              <input {...register('prixVente')} type="number" step="0.001" min="0" placeholder="0 = auto" className={inputClass(false)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Coût MO (DTN)</label>
              <input {...register('coutMO')} type="number" step="0.001" min="0" className={inputClass(false)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Unité</label>
              <select {...register('unite')} className={inputClass(false)}>
                <option value="unité">Unité</option>
                <option value="lot">Lot</option>
                <option value="boîte">Boîte</option>
                <option value="palette">Palette</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1 flex items-center gap-1">
              Seuil alerte stock <AlertTriangle className="w-3 h-3 text-orange-400" />
            </label>
            <input {...register('seuilAlerte')} type="number" step="1" min="0" placeholder="0" className={inputClass(false)} />
          </div>
        </div>

        {/* Classification */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-medium">Classification</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Catégorie</label>
              <select {...register('categoryId')} className={inputClass(false)}>
                <option value="">-- Aucune --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Produit parent (variante)</label>
              <select {...register('parentId')} className={inputClass(false)}>
                <option value="">-- Produit principal --</option>
                {parentProducts.map(p => <option key={p.id} value={p.id}>{p.nom} ({p.reference})</option>)}
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
          <button type="submit" disabled={isSubmitting || create.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
            {(isSubmitting || create.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
            Créer le produit
          </button>
        </div>
      </form>
    </div>
  );
}
