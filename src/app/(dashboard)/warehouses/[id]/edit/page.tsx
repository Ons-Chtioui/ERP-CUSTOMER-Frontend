'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

const warehouseSchema = z.object({
  nom: z.string().min(2, 'Le nom est requis').max(100),
  code: z.string()
    .min(2, 'Le code est requis')
    .max(20)
    .regex(/^[A-Z0-9-]+$/, 'Code invalide (majuscules, chiffres, tirets)'),
  adresse: z.string().optional(),
  ville: z.string().max(100).optional(),
  pays: z.string().max(60).default('Tunisie'),
});

type WarehouseFormData = z.infer<typeof warehouseSchema>;

export default function EditWarehousePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const warehouseId = parseInt(params.id as string);
  const [error, setError] = useState('');

  // Charger les données existantes
  const { data: warehouse, isLoading: isLoadingWarehouse } = useQuery({
    queryKey: ['warehouses', warehouseId],
    queryFn: () => api.get(`/warehouses/${warehouseId}`).then(r => r.data),
    enabled: !!warehouseId,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(warehouseSchema),
  });

  // Pré-remplir le formulaire
  useEffect(() => {
    if (warehouse) {
      reset({
        nom: warehouse.nom,
        code: warehouse.code,
        adresse: warehouse.adresse || '',
        ville: warehouse.ville || '',
        pays: warehouse.pays || 'Tunisie',
      });
    }
  }, [warehouse, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: WarehouseFormData) => api.put(`/warehouses/${warehouseId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses', 'summary'] });
      router.push('/warehouses');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Erreur lors de la modification');
    },
  });

  const onSubmit = (data: WarehouseFormData) => updateMutation.mutate(data);

  const inputClass = (hasError: boolean) =>
    cn(
      'w-full bg-gray-800 border rounded-lg px-3 py-2 text-white text-sm',
      'focus:outline-none focus:ring-1 transition-colors',
      hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500',
    );

  if (isLoadingWarehouse) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white">Modifier l'entrepôt</h1>
          <p className="text-gray-400 text-sm mt-0.5">Modifiez les informations</p>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        {/* Nom et Code */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nom <span className="text-red-400">*</span>
            </label>
            <input
              {...register('nom')}
              type="text"
              placeholder="Ex: Entrepôt Sousse Nord"
              className={inputClass(!!errors.nom)}
            />
            {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Code <span className="text-red-400">*</span>
            </label>
            <input
              {...register('code')}
              type="text"
              placeholder="Ex: WH-SOUSSE-01"
              className={cn(inputClass(!!errors.code), 'font-mono')}
            />
            <p className="text-gray-500 text-xs mt-1">Utilisé pour les QR codes</p>
            {errors.code && <p className="text-red-400 text-xs mt-1">{errors.code.message}</p>}
          </div>
        </div>

        {/* Adresse */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Adresse</label>
          <textarea
            {...register('adresse')}
            rows={3}
            placeholder="Adresse complète..."
            className={cn(inputClass(false), 'resize-none')}
          />
        </div>

        {/* Ville et Pays */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Ville</label>
            <input
              {...register('ville')}
              type="text"
              placeholder="Sousse"
              className={inputClass(false)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Pays</label>
            <input
              {...register('pays')}
              type="text"
              className={inputClass(false)}
            />
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Boutons */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 border border-gray-700 rounded-lg text-sm font-medium text-gray-300 hover:bg-gray-800 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}