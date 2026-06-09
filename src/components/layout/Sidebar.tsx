'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Users, UserCircle, LogOut, Warehouse } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const NAV = [
  { href: '/dashboard', label: 'Dashboard',     icon: LayoutDashboard },
  { href: '/users',     label: 'Utilisateurs',  icon: Users },
  { href: '/profile',   label: 'Mon profil',    icon: UserCircle },
  {href: '/warehouses', label: 'Entrepôts',     icon: Warehouse },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-gray-800 shrink-0">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">E</span>
        </div>
        <span className="text-white font-semibold">ERP</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <a
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-indigo-600 text-white font-medium'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800',
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </a>
          );
        })}
      </nav>

      {/* Footer : avatar + déconnexion */}
      <div className="px-3 pb-4 border-t border-gray-800 pt-3 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-8 h-8 bg-indigo-700 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-semibold">
              {user?.prenom?.[0]}{user?.nom?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.prenom} {user?.nom}
            </p>
            <p className="text-gray-500 text-xs truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-red-400 hover:bg-red-950/30 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
