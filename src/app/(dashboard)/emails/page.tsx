'use client';

import { useState } from 'react';
import { 
  Mail, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Play, 
  Loader2,
  FileText,
  AlertTriangle,
  Receipt
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEmailLogsWithFilters, EmailLog } from '@/hooks/useEmailLogs';
import { useEmailStream, EmailStatus } from '@/hooks/useEmailStream';

function getStatusBadge(status: EmailStatus) {
  switch (status) {
    case 'sent':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-950/40 text-green-400 border border-green-800/40">
          <CheckCircle className="w-3.5 h-3.5" /> Envoyé
        </span>
      );
    case 'failed':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-950/40 text-red-400 border border-red-800/40">
          <AlertCircle className="w-3.5 h-3.5" /> Échoué
        </span>
      );
    case 'sending':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-950/40 text-blue-400 border border-blue-800/40 animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Envoi...
        </span>
      );
    case 'pending':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-950/40 text-yellow-400 border border-yellow-800/40">
          <Clock className="w-3.5 h-3.5 animate-pulse" /> En attente
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-800 text-gray-400 border border-gray-700">
          {status}
        </span>
      );
  }
}

function getTemplateBadge(template: string) {
  const t = template.toLowerCase();
  if (t.includes('invoice')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-900/30 text-indigo-400 border border-indigo-800/30">
        <Receipt className="w-3 h-3" /> Facture
      </span>
    );
  }
  if (t.includes('quote')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-emerald-900/30 text-emerald-400 border border-emerald-800/30">
        <FileText className="w-3 h-3" /> Devis
      </span>
    );
  }
  if (t.includes('alert')) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-900/30 text-orange-400 border border-orange-800/30">
        <AlertTriangle className="w-3 h-3" /> Alerte stock
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-gray-400 border border-gray-700">
      {template}
    </span>
  );
}

export default function EmailsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [searchEmail, setSearchEmail] = useState<string>('');

  const { 
    logs, 
    isLoading, 
    isError, 
    refetch, 
    resend, 
    isResending 
  } = useEmailLogsWithFilters({
    status: statusFilter || undefined,
    relatedType: typeFilter || undefined,
  });

  // Enable live updates via SSE stream
  const { connected } = useEmailStream();

  // Search filter applied locally
  const filteredLogs = logs.filter(log => {
    if (searchEmail.trim() === '') return true;
    return log.toEmail.toLowerCase().includes(searchEmail.toLowerCase()) || 
           (log.toName && log.toName.toLowerCase().includes(searchEmail.toLowerCase()));
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white">Historique des e-mails</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Suivi en temps réel des e-mails transactionnels envoyés par l&apos;ERP.
          </p>
        </div>
        
        {/* SSE Stream Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-900 border border-gray-800 rounded-lg">
            <span className={cn(
              "w-2.5 h-2.5 rounded-full shrink-0",
              connected ? "bg-green-500 animate-ping" : "bg-red-500"
            )} />
            <span className={cn(
              "w-2.5 h-2.5 rounded-full absolute shrink-0",
              connected ? "bg-green-500" : "bg-red-500"
            )} />
            <span className="text-xs text-gray-300 ml-1 font-medium font-sans">
              {connected ? 'Temps réel actif' : 'Déconnecté'}
            </span>
          </div>

          <button 
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-2 bg-gray-900 border border-gray-800 text-gray-400 hover:text-white rounded-lg transition disabled:opacity-50"
            title="Rafraîchir les logs"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-900 border border-gray-800 rounded-xl p-4">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
          <input 
            type="text" 
            placeholder="Rechercher par destinataire..." 
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status Filter */}
        <div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">Tous les statuts</option>
            <option value="pending">En attente (Pending)</option>
            <option value="sending">En cours (Sending)</option>
            <option value="sent">Envoyé (Sent)</option>
            <option value="failed">Échoué (Failed)</option>
          </select>
        </div>

        {/* Document Type Filter */}
        <div>
          <select 
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="">Tous les documents</option>
            <option value="invoice">Factures</option>
            <option value="quote">Devis</option>
            <option value="alert">Alertes Stock</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-xl">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
            <p className="text-sm">Chargement de l&apos;historique...</p>
          </div>
        ) : isError ? (
          <div className="py-20 flex flex-col items-center justify-center text-red-400">
            <AlertCircle className="w-8 h-8 mb-3" />
            <p className="text-sm">Erreur lors de la récupération des logs d&apos;email</p>
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-950/30 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                  <th className="py-4 px-6">Destinataire</th>
                  <th className="py-4 px-6">Objet</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Date de création</th>
                  <th className="py-4 px-6">Statut</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50 text-sm">
                {filteredLogs.map((log: EmailLog) => (
                  <tr key={log.id} className="hover:bg-gray-800/20 transition-colors group">
                    {/* Recipient */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="text-white font-medium">
                          {log.toName || 'Client / Contact'}
                        </span>
                        <span className="text-gray-500 text-xs mt-0.5">
                          {log.toEmail}
                        </span>
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="py-4 px-6 max-w-xs truncate text-gray-300" title={log.subject}>
                      {log.subject}
                    </td>

                    {/* Template */}
                    <td className="py-4 px-6">
                      {getTemplateBadge(log.template)}
                    </td>

                    {/* Date */}
                    <td className="py-4 px-6 text-gray-400 font-mono text-xs">
                      {new Date(log.createdAt).toLocaleString('fr-TN')}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(log.status)}
                        {log.error && (
                          <span className="text-[10px] text-red-400/80 font-mono max-w-[200px] line-clamp-1 hover:line-clamp-none transition-all" title={log.error}>
                            Erreur: {log.error}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Resend Button */}
                    <td className="py-4 px-6 text-right">
                      {log.status === 'failed' && (
                        <button
                          onClick={() => resend(log.id)}
                          disabled={isResending}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/20 hover:bg-indigo-600 border border-indigo-500/30 text-indigo-400 hover:text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Renvoyer
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500">
            <Mail className="w-12 h-12 text-gray-700 mb-3" />
            <p className="text-sm">Aucun log d&apos;email trouvé</p>
            <p className="text-gray-650 text-xs mt-1">
              Les logs s&apos;afficheront ici lorsque des e-mails automatiques seront déclenchés.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
