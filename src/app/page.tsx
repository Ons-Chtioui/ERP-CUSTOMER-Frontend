import { redirect } from 'next/navigation';

// La racine "/" redirige directement vers le dashboard.
// Le middleware protège "/dashboard", donc les non-authentifiés
// seront renvoyés vers "/login" automatiquement.
export default function RootPage() {
  redirect('/dashboard');
}
