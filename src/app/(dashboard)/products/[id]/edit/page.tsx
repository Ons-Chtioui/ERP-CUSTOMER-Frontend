'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft, Package, Tag, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProduct, useUpdateProduct } from '@/hooks/useProducts';
import { useProductCategories } from '@/hooks/useProductCategories';
import { useProducts } from '@/hooks/useProducts';
import { useState } from 'react';

const schema = z.object({
  nom:         z.string().min(2, 'Nom requis').max(150),
  reference:   z.string().min(2, 'Référence requise').max(80).regex(/^[A-Z0-9-_]+$/, 'Majuscules, chiffres, tirets'),
  description: z.string().optional(),
  unite:       z.string().max(20),
  prixVente:   z.coerce.number().min(0),
  coutMO:      z.coerce.number().min(0),
  seuilAlerte: z.coerce.number().int().min(0),
  categoryId:  z.coerce.number().optional(),
});

type FormData = z.infer<typeof schema>;

export default function EditProductPage() {
  const router = useRouter();
  const { id } = useParams();
  const productId = parseInt(id as string);

  const { data: product, isLoading } = useProduct(productId);
  const { data: categories = [] } = useProductCategories();
  const update = useUpdateProduct();
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } =
    useForm<FormData>({ resolver: zodResolver(schema) });

  // Pré-remplir le formulaire dès que le produit est chargé
  useEffect(() => {
    if (product) {
      reset({
        nom:         product.nom,
        reference:   product.reference,
        description: product.description ?? '',
        unite:       product.unite,
        prixVente:   Number(product.prixVente),
        coutMO:      Number(product.coutMO),
        seuilAlerte: product.seuilAlerte,
        categoryId:  product.category?.id ?? undefined,
      });
    }
  }, [product, reset]);

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await update.mutateAsync({
        id: productId,
        ...data,
        categoryId: data.categoryId || undefined,
      });
      router.push(`/products/${productId}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Erreur lors de la mise à jour');
    }
  };

  const inputClass = (hasError: boolean) => cn(
    'w-full bg-gray-800 border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 transition-colors',
    hasError
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500',
  );

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
    </div>
  );

  if (!product) return (
    <div className="text-center py-16 text-gray-400">Produit introuvable</div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white">Modifier le produit</h1>
          <p className="text-gray-400 text-sm mt-0.5 font-mono">{product.reference}</p>
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
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Nom <span className="text-red-400">*</span>
              </label>
              <input {...register('nom')} className={inputClass(!!errors.nom)} />
              {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Référence <span className="text-red-400">*</span>
              </label>
              <input
                {...register('reference')}
                className={cn(inputClass(!!errors.reference), 'font-mono uppercase')}
              />
              {errors.reference && <p className="text-red-400 text-xs mt-1">{errors.reference.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea {...register('description')} rows={2} className={cn(inputClass(false), 'resize-none')} />
          </div>
        </div>

        {/* Prix & coûts */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-medium flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-400" /> Prix & coûts
          </h2>
          <p className="text-gray-500 text-xs">
            Le coût de revient est recalculé automatiquement depuis la BOM si vous modifiez le coût MO.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Prix vente manuel (DTN)</label>
              <input {...register('prixVente')} type="number" step="0.001" min="0" className={inputClass(false)} />
              <p className="text-gray-600 text-xs mt-1">0 = calculé auto</p>
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
            <input {...register('seuilAlerte')} type="number" step="1" min="0" className={inputClass(false)} />
          </div>
        </div>

        {/* Classification */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-medium">Classification</h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Catégorie</label>
            <select {...register('categoryId')} className={inputClass(false)}>
              <option value="">-- Aucune --</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
          </div>
          {product.parent && (
            <div className="text-sm text-purple-400 bg-purple-950/20 border border-purple-800/30 rounded-lg px-3 py-2">
              Variante de <strong>{product.parent.nom}</strong> — le produit parent ne peut pas être changé ici.
            </div>
          )}
        </div>

        {/* Coût de revient actuel (lecture seule) */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs">Coût de revient actuel (calculé)</p>
            <p className="text-white font-semibold mt-0.5">{Number(product.coutRevient).toFixed(3)} DTN</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400 text-xs">Prix de vente auto (calculé)</p>
            <p className="text-green-400 font-semibold mt-0.5">{Number(product.prixVenteAuto).toFixed(3)} DTN</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="text-lg leading-none ml-4">×</button>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting || update.isPending || !isDirty}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {(isSubmitting || update.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
