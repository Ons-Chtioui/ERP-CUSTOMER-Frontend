'use client';

import type { ProductCategory } from '@/types/products';

interface Props {
  category?: ProductCategory | null;
  size?: 'sm' | 'md';
}

export function ProductCategoryBadge({ category, size = 'sm' }: Props) {
  if (!category) return null;

  const padding = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${padding}`}
      style={{
        backgroundColor: `${category.couleur}22`, // 13% opacity
        color: category.couleur,
        border: `1px solid ${category.couleur}44`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: category.couleur }}
      />
      {category.nom}
    </span>
  );
}
