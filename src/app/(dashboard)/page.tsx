'use client';

import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-white">
            Bonjour, {user?.prenom ?? '…'} 👋
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Rôle : <span className="text-indigo-400 font-medium">{user?.role ?? '—'}</span>
          </p>
        </div>
        <button
          onClick={logout}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
        >
          Déconnexion
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Utilisateurs actifs', value: '—' },
          { label: 'Rôles', value: '—' },
          { label: 'Permissions', value: '—' },
        ].map((card) => (
          <div
            key={card.label}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            <p className="text-gray-400 text-sm">{card.label}</p>
            <p className="text-3xl font-bold text-white mt-2">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
