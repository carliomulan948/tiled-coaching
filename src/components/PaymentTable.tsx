'use client';

import { Payment } from '@/lib/types';
import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface PaymentTableProps {
  payments: Payment[];
  clientNames?: Record<string, string>;
}

const methodLabels: Record<string, string> = {
  bank_transfer: 'Virement bancaire',
  card: 'Carte bancaire',
  cash: 'Espèces',
  check: 'Chèque',
};

const statusConfig = {
  completed: { icon: CheckCircle, label: 'Complété', class: 'text-green-400' },
  pending: { icon: Clock, label: 'En attente', class: 'text-yellow-400' },
  failed: { icon: XCircle, label: 'Échoué', class: 'text-red-400' },
};

export default function PaymentTable({ payments, clientNames = {} }: PaymentTableProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  if (payments.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500">
        <p>Aucun paiement enregistré</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-dark">
        <thead>
          <tr>
            <th className="text-left">Client</th>
            <th className="text-left">Référence</th>
            <th className="text-left">Méthode</th>
            <th className="text-left">Date</th>
            <th className="text-right">Montant</th>
            <th className="text-left">Statut</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => {
            const status = statusConfig[payment.status];
            const StatusIcon = status.icon;
            return (
              <tr key={payment.id}>
                <td>
                  <span className="font-medium text-white">{clientNames[payment.clientId] || payment.clientId}</span>
                </td>
                <td>
                  <span className="font-mono text-sm text-slate-400">{payment.reference || '—'}</span>
                </td>
                <td>
                  <span className="text-slate-300">{methodLabels[payment.method] || payment.method}</span>
                </td>
                <td>
                  <span className="text-slate-400">{formatDate(payment.date)}</span>
                </td>
                <td className="text-right">
                  <span className="font-semibold text-white">{formatAmount(payment.amount)}</span>
                </td>
                <td>
                  <div className={`flex items-center gap-1.5 ${status.class}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span className="text-sm">{status.label}</span>
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
