'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateIn, useCreateOut, useCreateTransfer } from '@/hooks/useStockMovements';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useComponents } from '@/hooks/useComponents';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const schema = z.object({
  warehouseId: z.coerce.number().positive('Entrepôt requis'),
  componentId: z.coerce.number().positive('Composant requis'),
  quantity: z.coerce.number().positive('La quantité doit être > 0'),
  targetWarehouseId: z.coerce.number().optional(),
  referenceDoc: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;
type MType = 'IN' | 'OUT' | 'TRANSFER';

const TYPE_CONFIG = {
  IN: { label: 'Entrée', color: 'bg-green-600', hover: 'hover:bg-green-500', icon: '📥' },
  OUT: { label: 'Sortie', color: 'bg-red-600', hover: 'hover:bg-red-500', icon: '📤' },
  TRANSFER: { label: 'Transfert', color: 'bg-blue-600', hover: 'hover:bg-blue-500', icon: '🔄' },
};

export function MovementForm({ onSuccess }: { onSuccess?: () => void }) {
  const [type, setType] = useState<MType>('IN');
  const [error, setError] = useState('');

  const { data: warehouses } = useWarehouses();
  const { data: components } = useComponents();

  const createIn = useCreateIn();
  const createOut = useCreateOut();
  const createTransfer = useCreateTransfer();

  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const selectedWarehouseId = watch('warehouseId');

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      if (type === 'IN') {
        await createIn.mutateAsync(data);
      } else if (type === 'OUT') {
        await createOut.mutateAsync(data);
      } else {
        if (!data.targetWarehouseId) {
          setError('Entrepôt destination requis');
          return;
        }
        await createTransfer.mutateAsync({ ...data, targetWarehouseId: data.targetWarehouseId });
      }
      reset();
      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'opération');
    }
  };

  const isPending = createIn.isPending || createOut.isPending || createTransfer.isPending;
  const availableWarehouses = warehouses?.filter(w => w.isActive);

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {(['IN', 'OUT', 'TRANSFER'] as MType[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              type === t
                ? `${TYPE_CONFIG[t].color} text-white`
                : "bg-gray-800 text-gray-400 hover:bg-gray-700"
            )}
          >
            <span>{TYPE_CONFIG[t].icon}</span>
            {TYPE_CONFIG[t].label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {type === 'TRANSFER' ? 'Entrepôt source' : 'Entrepôt'}
            </label>
            <select
              {...register('warehouseId')}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">— Sélectionner —</option>
              {availableWarehouses?.map(w => (
                <option key={w.id} value={w.id}>{w.nom} ({w.code})</option>
              ))}
            </select>
            {errors.warehouseId && <p className="text-red-400 text-xs mt-1">{errors.warehouseId.message}</p>}
          </div>

          {type === 'TRANSFER' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Entrepôt destination</label>
              <select
                {...register('targetWarehouseId')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
              >
                <option value="">— Sélectionner —</option>
                {availableWarehouses
                  ?.filter(w => w.id !== selectedWarehouseId)
                  .map(w => (
                    <option key={w.id} value={w.id}>{w.nom} ({w.code})</option>
                  ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Composant</label>
            <select
              {...register('componentId')}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">— Sélectionner —</option>
              {components?.map(c => (
                <option key={c.id} value={c.id}>[{c.reference}] {c.nom}</option>
              ))}
            </select>
            {errors.componentId && <p className="text-red-400 text-xs mt-1">{errors.componentId.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Quantité</label>
            <input
              {...register('quantity')}
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
            {errors.quantity && <p className="text-red-400 text-xs mt-1">{errors.quantity.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Document référence</label>
            <input
              {...register('referenceDoc')}
              type="text"
              placeholder="N° BL, commande, etc."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">Notes</label>
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="Informations complémentaires..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-950 border border-red-800 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending || isSubmitting}
          className={cn(
            "w-full py-2.5 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50",
            TYPE_CONFIG[type].color,
            TYPE_CONFIG[type].hover
          )}
        >
          {isPending || isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Enregistrement...
            </span>
          ) : (
            `Enregistrer la ${TYPE_CONFIG[type].label.toLowerCase()}`
          )}
        </button>
      </form>
    </div>
  );
}