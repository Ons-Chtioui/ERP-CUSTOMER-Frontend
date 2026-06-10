'use client';

import { Package } from 'lucide-react';
import { getImageUrl } from '@/lib/imageUrl';
import { cn } from '@/lib/utils';

interface ComponentImageProps {
  imageUrl?: string | null;
  nom?: string;
  /** Taille du conteneur — défaut: w-10 h-10 */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizes = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
  xl: 'w-10 h-10',
};

export function ComponentImage({ imageUrl, nom, size = 'md', className }: ComponentImageProps) {
  const src = getImageUrl(imageUrl);

  return src ? (
    <img
      src={src}
      alt={nom ?? 'Composant'}
      className={cn(sizes[size], 'rounded-lg object-cover border border-gray-700 shrink-0', className)}
      onError={(e) => {
        // Si l'image ne charge pas → afficher le placeholder
        const target = e.currentTarget;
        target.style.display = 'none';
        const parent = target.parentElement;
        if (parent) {
          parent.innerHTML = `<div class="${sizes[size]} rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0"><svg class="${iconSizes[size]} text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg></div>`;
        }
      }}
    />
  ) : (
    <div className={cn(sizes[size], 'rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0', className)}>
      <Package className={cn(iconSizes[size], 'text-gray-600')} />
    </div>
  );
}
