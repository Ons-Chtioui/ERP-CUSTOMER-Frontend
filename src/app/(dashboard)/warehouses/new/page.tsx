'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Loader2, ArrowLeft, Warehouse } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateWarehouse } from '@/hooks/useWarehouses';

const schema = z.object({
  nom:     z.string().min(2, 'Nom requis').max(100),
  code:    z.string().min(2, 'Code requis').max(20).regex(/^[A-Z0-9-]+$/, 'Majuscules, chiffres, tirets'),
  adresse: z.string().optional(),
  ville:   z.string().max(100).optional(),
  pays:    z.string().max(60).default('Tunisie'),
});

type FormData = z.infer<typeof schema>;

export default function NewWarehousePage() {
  const router = useRouter();
  const create = useCreateWarehouse();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { pays: 'Tunisie' },
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await create.mutateAsync(data);
      router.push('/warehouses');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Erreur lors de la création');
    }
  };

  const inputClass = (hasError: boolean) => cn(
    'w-full bg-gray-800 border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 transition-colors',
    hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500',
  );

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white">Nouvel entrepôt</h1>
          <p className="text-gray-400 text-sm mt-0.5">Ajouter un site de stockage</p>
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
              <input {...register('nom')} placeholder="Entrepôt Central" className={inputClass(!!errors.nom)} />
              {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Code <span className="text-red-400">*</span></label>
              <input {...register('code')} placeholder="WH-TUN-01" className={cn(inputClass(!!errors.code), 'font-mono uppercase')} />
              {errors.code && <p className="text-red-400 text-xs mt-1">{errors.code.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Adresse</label>
            <textarea {...register('adresse')} rows={2} placeholder="Rue, numéro..." className={cn(inputClass(false), 'resize-none')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Ville</label>
              <input {...register('ville')} placeholder="Tunis" className={inputClass(false)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Pays</label>
              <input {...register('pays')} className={inputClass(false)} />
            </div>
          </div>

          {error && (
            <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={isSubmitting || create.isPending} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
              {(isSubmitting || create.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
              Créer l'entrepôt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
