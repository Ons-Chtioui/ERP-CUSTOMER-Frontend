/**
 * Helper pour construire les URLs des médias (images, fichiers)
 * servis par le backend en dehors du préfixe /api.
 *
 * Usage : mediaUrl('/uploads/components/xxx.jpg')
 * → 'http://localhost:3001/uploads/components/xxx.jpg'
 */
export function mediaUrl(path: string | null | undefined): string {
  if (!path) return '';

  // Déjà une URL absolue
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  // Base = NEXT_PUBLIC_API_URL sans le suffixe /api
  const base = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api')
    .replace(/\/api\/?$/, '');

  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}

/** Alias — même fonction, nom différent */
export { mediaUrl as getImageUrl };
