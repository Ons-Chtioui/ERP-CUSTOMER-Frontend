'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { 
  Bell, 
  User, 
  Check, 
  Trash2, 
  AlertTriangle, 
  ShoppingCart, 
  Receipt, 
  Mail, 
  Info,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNotificationsCombined, NotificationType } from '@/hooks/useNotifications';

const ROUTE_TITLES: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/users': 'Gestion des utilisateurs',
  '/roles': 'Rôles & Permissions',
  '/warehouses': 'Gestion des entrepôts',
  '/components': 'Gestion des composants',
  '/stock-movements': 'Mouvements de stock',
  '/inventory': 'Inventaires physiques',
  '/alerts': 'Alertes de stock critique',
  '/products': 'Produits finis & BOM',
  '/clients': 'Gestion des clients',
  '/orders': 'Commandes clients',
  '/quotes': 'Devis & Propositions',
  '/invoices': 'Factures & Avoirs',
  '/delivery-notes': 'Bons de livraison',
  '/profile': 'Mon profil utilisateur',
  '/emails': 'Historique des e-mails',
};

function getRouteTitle(pathname: string): string {
  if (!pathname) return 'ERP';
  
  // Match exact route
  if (ROUTE_TITLES[pathname]) return ROUTE_TITLES[pathname];
  
  // Match parent routes (e.g. /invoices/12 -> /invoices)
  for (const route in ROUTE_TITLES) {
    if (route !== '/dashboard' && pathname.startsWith(route)) {
      return ROUTE_TITLES[route];
    }
  }
  return 'ERP';
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'stock_alert':
      return <AlertTriangle className="w-4 h-4 text-orange-400" />;
    case 'order_status':
      return <ShoppingCart className="w-4 h-4 text-indigo-400" />;
    case 'invoice_due':
      return <Receipt className="w-4 h-4 text-red-400" />;
    case 'email_sent':
      return <Mail className="w-4 h-4 text-green-400" />;
    default:
      return <Info className="w-4 h-4 text-blue-400" />;
  }
}

export function Header() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    delete: deleteNotif 
  } = useNotificationsCombined({ limit: 10 });

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-16 border-b border-gray-800 bg-gray-900/60 backdrop-blur-md px-8 flex items-center justify-between z-40 shrink-0">
      {/* Page Title */}
      <h2 className="text-lg font-medium text-white tracking-wide">
        {getRouteTitle(pathname)}
      </h2>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Notifications Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          {/* Bell button */}
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="relative p-2 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-lg transition-all focus:outline-none"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Dropdown menu */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-96 rounded-xl border border-gray-850 bg-gray-900/95 backdrop-blur-md shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-800 bg-gray-950/40 flex items-center justify-between">
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAllAsRead()}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition"
                  >
                    <Check className="w-3.5 h-3.5" /> Tout marquer lu
                  </button>
                )}
              </div>

              {/* List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-gray-800/60">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div 
                      key={notif.id} 
                      className={cn(
                        "p-4 flex gap-3 hover:bg-gray-800/30 transition group",
                        !notif.isRead && "bg-indigo-950/10"
                      )}
                    >
                      {/* Icon */}
                      <div className="mt-0.5 shrink-0 p-1.5 bg-gray-800/80 rounded-lg border border-gray-700/30">
                        {getNotificationIcon(notif.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            "text-xs font-semibold truncate",
                            notif.isRead ? "text-gray-300" : "text-white"
                          )}>
                            {notif.title}
                          </p>
                          <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap">
                            {new Date(notif.createdAt).toLocaleDateString('fr-TN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>
                        
                        {/* Link if exists */}
                        {notif.link && (
                          <a 
                            href={notif.link}
                            onClick={() => setIsOpen(false)}
                            className="inline-block text-[11px] text-indigo-400 hover:text-indigo-300 font-medium mt-1.5 transition"
                          >
                            Consulter →
                          </a>
                        )}
                      </div>

                      {/* Actions hover */}
                      <div className="flex flex-col gap-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notif.isRead && (
                          <button 
                            onClick={() => markAsRead(notif.id)}
                            className="p-1 text-gray-400 hover:text-green-400 hover:bg-green-950/20 rounded transition"
                            title="Marquer comme lu"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button 
                          onClick={() => deleteNotif(notif.id)}
                          className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-950/20 rounded transition"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-500">
                    <CheckCircle2 className="w-8 h-8 text-gray-600 mb-2" />
                    <p className="text-xs">Aucune notification</p>
                  </div>
                )}
              </div>

              {/* View all button */}
              {notifications.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-800 bg-gray-950/20 text-center">
                  <a 
                    href="/alerts"
                    onClick={() => setIsOpen(false)}
                    className="text-xs text-gray-400 hover:text-white transition font-medium"
                  >
                    Voir toutes les alertes de stock
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Vertical divider */}
        <div className="h-6 w-px bg-gray-800" />

        {/* User profile details */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end shrink-0 hidden sm:flex">
            <span className="text-xs font-semibold text-white">
              {user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}
            </span>
            <span className="text-[10px] text-gray-400 capitalize">
              {user?.role?.replace('_', ' ') ?? 'Opérateur'}
            </span>
          </div>
          
          <div className="w-8 h-8 bg-indigo-700 hover:bg-indigo-600 rounded-lg border border-indigo-600/30 flex items-center justify-center font-bold text-xs text-white shrink-0 cursor-default select-none shadow-md shadow-indigo-900/20">
            {user ? `${user.prenom?.charAt(0)}${user.nom?.charAt(0)}` : <User className="w-4 h-4" />}
          </div>
        </div>
      </div>
    </header>
  );
}
