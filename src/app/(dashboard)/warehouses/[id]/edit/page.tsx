'use client';

import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2, ArrowLeft, Warehouse } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUpdateWarehouse } from '@/hooks/useWarehouses';
import api from '@/lib/api';

const schema = z.object({
  nom:     z.string().min(2, 'Nom requis').max(100),
  code:    z.string().min(2, 'Code requis').max(20),
  adresse: z.string().optional(),
  ville:   z.string().max(100).optional(),
  pays:    z.string().max(60).optional(),
});

type FormData = z.infer<typeof schema>;

export default function EditWarehousePage() {
  const router = useRouter();
  const { id } = useParams();
  const warehouseId = parseInt(id as string);
  const update = useUpdateWarehouse();
  const [error, setError] = useState('');

  const { data: warehouse } = useQuery({
    queryKey: ['warehouses', warehouseId],
    queryFn: () => api.get(`/warehouses/${warehouseId}`).then(r => r.data),
    enabled: !!warehouseId,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (warehouse) {
      reset({
        nom: warehouse.nom,
        code: warehouse.code,
        adresse: warehouse.adresse ?? '',
        ville: warehouse.ville ?? '',
        pays: warehouse.pays ?? 'Tunisie',
      });
    }
  }, [warehouse, reset]);

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await update.mutateAsync({ id: warehouseId, ...data });
      router.push(`/warehouses/${warehouseId}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Erreur lors de la modification');
    }
  };

  const inputClass = (hasError: boolean) => cn(
    'w-full bg-gray-800 border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 transition-colors',
    hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500',
  );

  if (!warehouse) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white">Modifier l'entrepôt</h1>
          <p className="text-gray-400 text-sm mt-0.5">{warehouse.nom}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h2 className="text-white font-medium flex items-center gap-2 mb-5">
          <Warehouse className="w-4 h-4 text-indigo-400" />
          Informations
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Nom <span className="text-red-400">*</span></label>
              <input {...register('nom')} className={inputClass(!!errors.nom)} />
              {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Code</label>
              <input {...register('code')} className={cn(inputClass(!!errors.code), 'font-mono')} />
              {errors.code && <p className="text-red-400 text-xs mt-1">{errors.code.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Adresse</label>
            <textarea {...register('adresse')} rows={2} className={cn(inputClass(false), 'resize-none')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Ville</label>
              <input {...register('ville')} className={inputClass(false)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Pays</label>
              <input {...register('pays')} className={inputClass(false)} />
            </div>
          </div>

          {error && <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting || update.isPending} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
              {(isSubmitting || update.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
