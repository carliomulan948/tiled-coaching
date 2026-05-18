'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getAuth, getPayments, getCoaches, getClients, getCoachById, updateCoachIban } from '@/lib/storage';
import { Payment, Client, Coach } from '@/lib/types';
import { CreditCard, Edit2, Check, X, Building2, TrendingUp, Clock, AlertCircle } from 'lucide-react';

const methodLabel = {
  bank_transfer: 'Virement bancaire',
  card: 'Carte bancaire',
  cash: 'Espèces',
  check: 'Chèque',
};

const statusConfig = {
  completed: { label: 'Complété', cls: 'bg-green-500/20 text-green-400 border-green-500/30' },
  pending: { label: 'En attente', cls: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  failed: { label: 'Échoué', cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [editingIban, setEditingIban] = useState(false);
  const [ibanInput, setIbanInput] = useState('');
  const [role, setRole] = useState('coach');

  useEffect(() => {
    const auth = getAuth();
    if (!auth.isAuthenticated) { router.push('/'); return; }
    setRole(auth.role || 'coach');
    const allPayments = getPayments();
    const allClients = getClients();

    if (auth.role === 'coach') {
      const cid = auth.user?.id || 'coach-1';
      const c = getCoachById(cid);
      setCoach(c || null);
      setIbanInput(c?.iban || '');
      setPayments(allPayments.filter(p => p.coachId === cid));
      setClients(allClients.filter(c => c.coachId === cid));
    } else if (auth.role === 'admin') {
      setPayments(allPayments);
      setClients(allClients);
    } else {
      setPayments(allPayments.filter(p => p.clientId === auth.user?.id));
    }
  }, [router]);

  const handleSaveIban = () => {
    if (coach) {
      updateCoachIban(coach.id, ibanInput);
      setCoach(prev => prev ? { ...prev, iban: ibanInput } : null);
    }
    setEditingIban(false);
  };

  const totalReceived = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter(p => p.status === 'pending').reduce((s, p) => s + p.amount, 0);

  const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name || 'Inconnu';

  return (
    <div className="flex min-h-screen bg-[#080d1a]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Paiements</h1>
          <p className="text-slate-400 text-sm">{payments.length} transaction{payments.length > 1 ? 's' : ''}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card-dark flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">Total encaissé</div>
              <div className="text-xl font-bold text-white">{totalReceived.toLocaleString('fr-FR')} €</div>
            </div>
          </div>
          <div className="card-dark flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">En attente</div>
              <div className="text-xl font-bold text-white">{totalPending.toLocaleString('fr-FR')} €</div>
            </div>
          </div>
          <div className="card-dark flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-xs text-slate-400 mb-0.5">Total transactions</div>
              <div className="text-xl font-bold text-white">{payments.length}</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* IBAN section */}
          {coach && (
            <div className="lg:col-span-1">
              <div className="card-dark">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="font-semibold text-white">Coordonnées bancaires</h2>
                </div>
                <div className="mb-4">
                  <div className="text-xs text-slate-400 mb-2">IBAN du coach</div>
                  {editingIban ? (
                    <div className="space-y-3">
                      <input
                        className="input-dark font-mono text-sm"
                        value={ibanInput}
                        onChange={e => setIbanInput(e.target.value.toUpperCase())}
                        placeholder="FR76 XXXX XXXX XXXX XXXX XXXX XXX"
                      />
                      <div className="flex gap-2">
                        <button onClick={handleSaveIban} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 text-sm transition-colors">
                          <Check className="w-4 h-4" /> Enregistrer
                        </button>
                        <button onClick={() => { setEditingIban(false); setIbanInput(coach.iban || ''); }}
                          className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 text-sm transition-colors">
                          <X className="w-4 h-4" /> Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#0f172a] border border-[#2d3748]">
                      <span className="font-mono text-sm text-white break-all">{coach.iban || 'Non renseigné'}</span>
                      <button onClick={() => setEditingIban(true)} className="text-slate-500 hover:text-blue-400 transition-colors flex-shrink-0">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="text-xs text-slate-600 flex items-start gap-1.5">
                  <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span>Partagez cet IBAN avec vos clients pour recevoir vos paiements par virement.</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment history */}
          <div className={coach ? 'lg:col-span-2' : 'lg:col-span-3'}>
            <div className="card-dark p-0 overflow-hidden">
              <div className="px-5 py-4 border-b border-[#2d3748]">
                <h2 className="font-semibold text-white">Historique des paiements</h2>
              </div>
              <table className="w-full table-dark">
                <thead>
                  <tr>
                    <th className="text-left">Client</th>
                    <th className="text-left">Montant</th>
                    <th className="text-left">Date</th>
                    <th className="text-left">Méthode</th>
                    <th className="text-left">Référence</th>
                    <th className="text-left">Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr><td colSpan={6} className="text-center text-slate-500 py-12">Aucun paiement</td></tr>
                  ) : [...payments].sort((a, b) => b.date.localeCompare(a.date)).map(pay => {
                    const cfg = statusConfig[pay.status];
                    return (
                      <tr key={pay.id}>
                        <td className="font-medium text-white">{getClientName(pay.clientId)}</td>
                        <td className="font-semibold text-white">{pay.amount.toLocaleString('fr-FR')} €</td>
                        <td className="text-slate-400">{new Date(pay.date).toLocaleDateString('fr-FR')}</td>
                        <td className="text-slate-400">{methodLabel[pay.method]}</td>
                        <td className="font-mono text-xs text-slate-500">{pay.reference || '—'}</td>
                        <td>
                          <span className={`text-xs px-2.5 py-1 rounded-full border ${cfg.cls}`}>{cfg.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
