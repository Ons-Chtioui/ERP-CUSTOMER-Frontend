/**
 * Convertit un chemin relatif de fichier backend (/uploads/...)
 * en URL absolue pointant vers le serveur backend.
 */
export function mediaUrl(path: string | undefined | null): string | undefined {
  if (!path) return undefined;
  // Si déjà une URL absolue (http/https), la retourner telle quelle
  if (path.startsWith('http')) return path;
  const base = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? 'http://localhost:3001';
  return `${base}${path}`;
}
