'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { 
  Loader2, 
  ArrowLeft, 
  Save, 
  Package,
  Building2,
  Tag,
  DollarSign,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  X,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import { Category, Supplier } from '@/types/stock';

const componentSchema = z.object({
  nom: z.string().min(2, 'Le nom est requis').max(150),
  reference: z.string()
    .min(2, 'La référence est requise')
    .max(80)
    .regex(/^[A-Z0-9-]+$/, 'Code invalide (majuscules, chiffres, tirets)'),
  description: z.string().optional(),
  unite: z.string().max(20).default('unité'),
  prixAchat: z.coerce.number().min(0, 'Le prix doit être positif').default(0),
  seuilAlerte: z.coerce.number().int().min(0, 'Le seuil doit être positif').default(0),
  categoryId: z.coerce.number().optional(),
  supplierId: z.coerce.number().optional(),
});

type ComponentFormData = z.infer<typeof componentSchema>;

export default function NewComponentPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Récupérer les catégories
  const { data: categories, isLoading: isLoadingCategories } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => api.get('/components/categories').then(r => r.data),
  });

  // Récupérer les fournisseurs
  const { data: suppliers, isLoading: isLoadingSuppliers } = useQuery<Supplier[]>({
    queryKey: ['suppliers'],
    queryFn: () => api.get('/components/suppliers').then(r => r.data),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ComponentFormData>({
    resolver: zodResolver(componentSchema),
    defaultValues: {
      unite: 'unité',
      prixAchat: 0,
      seuilAlerte: 0,
    },
  });

  // Dropzone pour l'image
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setImageFile(file);
      const preview = URL.createObjectURL(file);
      setImagePreview(preview);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp']
    },
    maxFiles: 1,
    maxSize: 2 * 1024 * 1024, // 2MB
  });

  const removeImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  // Upload de l'image vers le serveur
  const uploadImage = async (componentId: number): Promise<string | null> => {
    if (!imageFile) return null;
    
    setIsUploading(true);
    const formData = new FormData();
    formData.append('image', imageFile);
    
    try {
      const response = await api.post(`/components/${componentId}/image`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data.imageUrl;
    } catch (err) {
      console.error('Erreur upload image:', err);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: ComponentFormData) => {
      // 1. Créer le composant
      const response = await api.post('/components', data);
      const component = response.data;
      
      // 2. Uploader l'image si présente
      if (imageFile && component.id) {
        const formData = new FormData();
        formData.append('image', imageFile);
        await api.post(`/components/${component.id}/image`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      
      return component;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['components'] });
      router.push('/components');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg[0] : msg || 'Erreur lors de la création');
    },
  });

  const onSubmit = (data: ComponentFormData) => createMutation.mutate(data);

  const inputClass = (hasError: boolean) =>
    cn(
      'w-full bg-gray-800 border rounded-lg px-3 py-2 text-white text-sm',
      'focus:outline-none focus:ring-1 transition-colors',
      hasError
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-700 focus:border-indigo-500 focus:ring-indigo-500',
    );

  const isLoading = isLoadingCategories || isLoadingSuppliers;

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div>
          <h1 className="text-2xl font-semibold text-white">Nouveau composant</h1>
          <p className="text-gray-400 text-sm mt-0.5">Ajoutez un article à votre catalogue</p>
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
        {/* Upload image */}
        <div className="pb-3 border-b border-gray-800">
          <h2 className="text-white font-medium flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-indigo-400" />
            Image du produit
          </h2>
        </div>

        <div>
          {!imagePreview ? (
            <div
              {...getRootProps()}
              className={cn(
                'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
                isDragActive
                  ? 'border-indigo-500 bg-indigo-950/30'
                  : 'border-gray-700 hover:border-gray-600'
              )}
            >
              <input {...getInputProps()} />
              <Upload className="w-10 h-10 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                {isDragActive
                  ? 'Déposez l\'image ici'
                  : 'Glissez-déposez une image ou cliquez pour sélectionner'}
              </p>
              <p className="text-gray-600 text-xs mt-1">
                PNG, JPG, GIF, WEBP (max. 2MB)
              </p>
            </div>
          ) : (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Aperçu"
                className="w-32 h-32 object-cover rounded-lg border border-gray-700"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 p-1 bg-red-600 rounded-full hover:bg-red-500 transition-colors"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Informations de base */}
        <div className="pb-3 border-b border-gray-800 pt-2">
          <h2 className="text-white font-medium flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-400" />
            Informations générales
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Nom <span className="text-red-400">*</span>
            </label>
            <input
              {...register('nom')}
              type="text"
              placeholder="Ex: Pied de chaise standard"
              className={inputClass(!!errors.nom)}
            />
            {errors.nom && <p className="text-red-400 text-xs mt-1">{errors.nom.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Référence <span className="text-red-400">*</span>
            </label>
            <input
              {...register('reference')}
              type="text"
              placeholder="Ex: PIED-001"
              className={cn(inputClass(!!errors.reference), 'font-mono')}
            />
            <p className="text-gray-500 text-xs mt-1">Code unique, utilisé pour les QR codes</p>
            {errors.reference && <p className="text-red-400 text-xs mt-1">{errors.reference.message}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
          <textarea
            {...register('description')}
            rows={3}
            placeholder="Description du composant..."
            className={cn(inputClass(false), 'resize-none')}
          />
        </div>

        {/* Caractéristiques */}
        <div className="pb-3 border-b border-gray-800 pt-2">
          <h2 className="text-white font-medium flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-400" />
            Caractéristiques
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Unité de mesure</label>
            <select {...register('unite')} className={inputClass(!!errors.unite)}>
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
              Prix d'achat (DTN)
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                {...register('prixAchat')}
                type="number"
                step="0.001"
                placeholder="0.000"
                className={cn(inputClass(!!errors.prixAchat), 'pl-9')}
              />
            </div>
            {errors.prixAchat && <p className="text-red-400 text-xs mt-1">{errors.prixAchat.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Seuil d'alerte
            </label>
            <div className="relative">
              <AlertTriangle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                {...register('seuilAlerte')}
                type="number"
                step="1"
                placeholder="0"
                className={cn(inputClass(!!errors.seuilAlerte), 'pl-9')}
              />
            </div>
            <p className="text-gray-500 text-xs mt-1">Stock en dessous → alerte</p>
            {errors.seuilAlerte && <p className="text-red-400 text-xs mt-1">{errors.seuilAlerte.message}</p>}
          </div>
        </div>

        {/* Classification */}
        <div className="pb-3 border-b border-gray-800 pt-2">
          <h2 className="text-white font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-400" />
            Classification
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Catégorie</label>
            <select {...register('categoryId')} className={inputClass(false)}>
              <option value="">-- Sélectionner une catégorie --</option>
              {categories?.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nom}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Fournisseur</label>
            <select {...register('supplierId')} className={inputClass(false)}>
              <option value="">-- Sélectionner un fournisseur --</option>
              {suppliers?.map(sup => (
                <option key={sup.id} value={sup.id}>{sup.nom}</option>
              ))}
            </select>
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
            disabled={isSubmitting || isUploading}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {(isSubmitting || isUploading) && <Loader2 className="w-4 h-4 animate-spin" />}
            {isSubmitting || isUploading ? 'Création...' : 'Créer le composant'}
          </button>
        </div>
      </form>
    </div>
  );
}