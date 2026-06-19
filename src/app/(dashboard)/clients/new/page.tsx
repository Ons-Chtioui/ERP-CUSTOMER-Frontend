'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { Loader2, ArrowLeft, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCreateClient } from '@/hooks/useClients';

const schema = z.object({
  name:      z.string().min(2, 'Nom requis').max(150),
  email:     z.string().email('Email invalide').optional().or(z.literal('')),
  phone:     z.string().max(30).optional(),
  address:   z.string().optional(),
  city:      z.string().max(100).optional(),
  country:   z.string().max(60).default('Tunisie'),
  tvaNumber: z.string().max(50).optional(),
});
type FormData = z.infer<typeof schema>;

export default function NewClientPage() {
  const router = useRouter();
  const create = useCreateClient();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { country: 'Tunisie' },
  });

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const client = await create.mutateAsync({
        ...data,
        email: data.email || undefined,
      });
      router.push(`/clients/${client.id}`);
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
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-800 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white">Nouveau client</h1>
          <p className="text-gray-400 text-sm mt-0.5">Le code est généré automatiquement</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-white font-medium flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" /> Informations
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Nom <span className="text-red-400">*</span></label>
            <input {...register('name')} placeholder="Entreprise SA" className={inputClass(!!errors.name)} />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input {...register('email')} type="email" placeholder="contact@entreprise.com" className={inputClass(!!errors.email)} />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Téléphone</label>
              <input {...register('phone')} placeholder="+216 70 000 000" className={inputClass(false)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Adresse</label>
            <textarea {...register('address')} rows={2} className={cn(inputClass(false), 'resize-none')} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Ville</label>
              <input {...register('city')} placeholder="Tunis" className={inputClass(false)} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Pays</label>
              <input {...register('country')} className={inputClass(false)} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">N° TVA</label>
            <input {...register('tvaNumber')} placeholder="TN12345678" className={inputClass(false)} />
          </div>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.back()} className="px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-800 transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={isSubmitting || create.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
            {(isSubmitting || create.isPending) && <Loader2 className="w-4 h-4 animate-spin" />}
            Créer le client
          </button>
        </div>
      </form>
    </div>
  );
}
