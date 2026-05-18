'use client';

import { Invoice, InvoiceStatus } from '@/lib/types';
import { Eye, Trash2, Send, CheckCircle, MoreVertical } from 'lucide-react';
import { useState } from 'react';

interface InvoiceTableProps {
  invoices: Invoice[];
  onStatusChange?: (invoiceId: string, status: InvoiceStatus) => void;
  onDelete?: (invoiceId: string) => void;
}

const statusConfig: Record<InvoiceStatus, { label: string; className: string }> = {
  draft: { label: 'Brouillon', className: 'badge-draft' },
  sent: { label: 'Envoyée', className: 'badge-sent' },
  paid: { label: 'Payée', className: 'badge-paid' },
  overdue: { label: 'En retard', className: 'badge-overdue' },
};

export default function InvoiceTable({ invoices, onStatusChange, onDelete }: InvoiceTableProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  if (invoices.length === 0) {
    return (
      <div className="text-center py-16 text-slate-500">
        <p className="text-lg font-medium mb-2">Aucune facture</p>
        <p className="text-sm">Créez votre première facture en cliquant sur "Créer facture"</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-dark">
        <thead>
          <tr>
            <th className="text-left">Numéro</th>
            <th className="text-left">Client</th>
            <th className="text-right">Montant</th>
            <th className="text-left">Date</th>
            <th className="text-left">Échéance</th>
            <th className="text-left">Statut</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((invoice) => {
            const status = statusConfig[invoice.status];
            const isOverdue = invoice.status === 'sent' && new Date(invoice.dueDate) < new Date();

            return (
              <tr key={invoice.id} className="group">
                <td>
                  <span className="font-mono text-sm text-blue-400">{invoice.number}</span>
                </td>
                <td>
                  <div className="font-medium text-white">{invoice.clientName}</div>
                </td>
                <td className="text-right">
                  <span className="font-semibold text-white">{formatAmount(invoice.total)}</span>
                </td>
                <td>
                  <span className="text-slate-400">{formatDate(invoice.issueDate)}</span>
                </td>
                <td>
                  <span className={isOverdue ? 'text-red-400' : 'text-slate-400'}>
                    {formatDate(invoice.dueDate)}
                  </span>
                </td>
                <td>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${status.className}`}>
                    {status.label}
                  </span>
                </td>
                <td>
                  <div className="relative flex justify-center">
                    <button
                      onClick={() => setActiveMenu(activeMenu === invoice.id ? null : invoice.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {activeMenu === invoice.id && (
                      <div className="absolute right-0 top-full mt-1 w-52 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-10 py-1 animate-fade-in">
                        <button
                          onClick={() => { setActiveMenu(null); }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          Voir la facture
                        </button>
                        {invoice.status === 'draft' && onStatusChange && (
                          <button
                            onClick={() => { onStatusChange(invoice.id, 'sent'); setActiveMenu(null); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-blue-400 hover:bg-slate-700 transition-colors"
                          >
                            <Send className="w-4 h-4" />
                            Marquer comme envoyée
                          </button>
                        )}
                        {(invoice.status === 'sent' || invoice.status === 'overdue') && onStatusChange && (
                          <button
                            onClick={() => { onStatusChange(invoice.id, 'paid'); setActiveMenu(null); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-green-400 hover:bg-slate-700 transition-colors"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Marquer comme payée
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => { onDelete(invoice.id); setActiveMenu(null); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
