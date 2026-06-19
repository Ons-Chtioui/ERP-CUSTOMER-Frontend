'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useClient, useUpdateClient } from '@/hooks/useClients';

const schema = z.object({
  name:      z.string().min(2, 'Nom requis').max(150),
  email:     z.string().email('Email invalide').optional().or(z.literal('')),
  phone:     z.string().max(30).optional(),
  address:   z.string().optional(),
  city:      z.string().max(100).optional(),
  country:   z.string().max(60).optional(),
  tvaNumber: z.string().max(50).optional(),
});
type FormData = z.infer<typeof schema>;

export default function EditClientPage() {
  const router = useRouter();
  const { id } = useParams();
  const clientId = id as string;
  const { data: client } = useClient(clientId);
  const update = useUpdateClient();
  const [error, setError] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (client) reset({
      name:      client.name,
      email:     client.email ?? '',
      phone:     client.phone ?? '',
      address:   client.address ?? '',
      city:      client.city ?? '',
      country:   client.country,
      tvaNumber: client.tvaNumber ?? '',
    });
  }, [client, reset]);

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      await update.mutateAsync({ id: clientId, ...data, email: data.email || undefined });
      router.push(`/clients/${clientId}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Erreur');
    }
  };

  const inputClass = (hasError: boolean) => cn(
    'w-full bg-gray-800 border rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 transition-colors',
    hasError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500',
  );

  if (!client) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-indigo-400" /></div>;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white">Modifier le client</h1>
          <p className="text-gray-400 text-sm mt-0.5 font-mono">{client.code}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4" noValidate>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Nom <span className="text-red-400">*</span></label>
          <input {...register('name')} className={inputClass(!!errors.name)} />
          {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input {...register('email')} type="email" className={inputClass(!!errors.email)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Téléphone</label>
            <input {...register('phone')} className={inputClass(false)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Adresse</label>
          <textarea {...register('address')} rows={2} className={cn(inputClass(false), 'resize-none')} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Ville</label>
            <input {...register('city')} className={inputClass(false)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Pays</label>
            <input {...register('country')} className={inputClass(false)} />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">N° TVA</label>
          <input {...register('tvaNumber')} className={inputClass(false)} />
        </div>

        {error && <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={isSubmitting || update.isPending || !isDirty}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
            {(isSubmitting || update.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
            Enregistrer
          </button>
        </div>
      </form>
    </div>
  );
}
