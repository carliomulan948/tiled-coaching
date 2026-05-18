'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getAuth, getInvoices, saveInvoices, getClients } from '@/lib/storage';
import { Invoice, Client } from '@/lib/types';
import { Plus, Download, Send, Eye, Trash2, X, FileText } from 'lucide-react';

const statusConfig = {
  draft: { label: 'Brouillon', cls: 'badge-draft' },
  sent: { label: 'Envoyée', cls: 'badge-sent' },
  paid: { label: 'Payée', cls: 'badge-paid' },
  overdue: { label: 'En retard', cls: 'badge-overdue' },
};

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [coachId, setCoachId] = useState('coach-1');
  const [role, setRole] = useState('coach');
  const [form, setForm] = useState({
    clientId: '', description: '', quantity: 1, unitPrice: 65, dueInDays: 14, notes: '',
  });

  useEffect(() => {
    const auth = getAuth();
    if (!auth.isAuthenticated) { router.push('/'); return; }
    setRole(auth.role || 'coach');
    const cid = auth.user?.id || 'coach-1';
    setCoachId(cid);
    const allInvoices = getInvoices();
    const allClients = getClients();
    if (auth.role === 'coach') {
      setInvoices(allInvoices.filter(i => i.coachId === cid));
      setClients(allClients.filter(c => c.coachId === cid));
    } else if (auth.role === 'client') {
      setInvoices(allInvoices.filter(i => i.clientId === auth.user?.id));
    } else {
      setInvoices(allInvoices);
      setClients(allClients);
    }
  }, [router]);

  const filtered = filterStatus === 'all' ? invoices : invoices.filter(i => i.status === filterStatus);

  const handleCreate = () => {
    const client = clients.find(c => c.id === form.clientId);
    if (!client) return;
    const total = form.quantity * form.unitPrice;
    const today = new Date().toISOString().split('T')[0];
    const due = new Date(Date.now() + form.dueInDays * 86400000).toISOString().split('T')[0];
    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      number: `FAC-${new Date().getFullYear()}-${String(invoices.length + 1).padStart(3, '0')}`,
      coachId,
      clientId: form.clientId,
      clientName: client.name,
      items: [{ id: `item-${Date.now()}`, description: form.description, quantity: form.quantity, unitPrice: form.unitPrice, total }],
      subtotal: total,
      tax: 0,
      total,
      status: 'draft',
      issueDate: today,
      dueDate: due,
      notes: form.notes,
    };
    const all = getInvoices();
    all.push(newInv);
    saveInvoices(all);
    setInvoices(prev => [...prev, newInv]);
    setShowModal(false);
    setForm({ clientId: '', description: '', quantity: 1, unitPrice: 65, dueInDays: 14, notes: '' });
  };

  const updateStatus = (id: string, status: Invoice['status']) => {
    const all = getInvoices().map(i => i.id === id ? { ...i, status, ...(status === 'paid' ? { paidDate: new Date().toISOString().split('T')[0] } : {}) } : i);
    saveInvoices(all);
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status } : i));
  };

  const deleteInvoice = (id: string) => {
    const all = getInvoices().filter(i => i.id !== id);
    saveInvoices(all);
    setInvoices(prev => prev.filter(i => i.id !== id));
  };

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const totalPending = invoices.filter(i => i.status === 'sent').reduce((s, i) => s + i.total, 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((s, i) => s + i.total, 0);

  return (
    <div className="flex min-h-screen bg-[#080d1a]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Factures</h1>
            <p className="text-slate-400 text-sm">{invoices.length} facture{invoices.length > 1 ? 's' : ''}</p>
          </div>
          {role !== 'client' && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Créer une facture
            </button>
          )}
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card-dark">
            <div className="text-xs text-slate-400 mb-1">Revenus encaissés</div>
            <div className="text-xl font-bold text-green-400">{totalRevenue.toLocaleString('fr-FR')} €</div>
          </div>
          <div className="card-dark">
            <div className="text-xs text-slate-400 mb-1">En attente</div>
            <div className="text-xl font-bold text-blue-400">{totalPending.toLocaleString('fr-FR')} €</div>
          </div>
          <div className="card-dark">
            <div className="text-xs text-slate-400 mb-1">En retard</div>
            <div className="text-xl font-bold text-red-400">{totalOverdue.toLocaleString('fr-FR')} €</div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {['all', 'draft', 'sent', 'paid', 'overdue'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                filterStatus === s ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-[#1e2433] text-slate-400 border-[#2d3748] hover:border-slate-500'
              }`}>
              {s === 'all' ? 'Toutes' : statusConfig[s as keyof typeof statusConfig]?.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="card-dark p-0 overflow-hidden">
          <table className="w-full table-dark">
            <thead>
              <tr>
                <th className="text-left">Numéro</th>
                <th className="text-left">Client</th>
                <th className="text-left">Montant</th>
                <th className="text-left">Date émission</th>
                <th className="text-left">Échéance</th>
                <th className="text-left">Statut</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="text-center text-slate-500 py-12">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Aucune facture
                </td></tr>
              ) : filtered.map(inv => {
                const cfg = statusConfig[inv.status];
                const isOverdue = inv.status !== 'paid' && new Date(inv.dueDate) < new Date();
                return (
                  <tr key={inv.id}>
                    <td className="font-mono text-xs text-slate-300">{inv.number}</td>
                    <td className="font-medium text-white">{inv.clientName}</td>
                    <td className="font-semibold text-white">{inv.total.toLocaleString('fr-FR')} €</td>
                    <td className="text-slate-400">{new Date(inv.issueDate).toLocaleDateString('fr-FR')}</td>
                    <td className={isOverdue ? 'text-red-400 font-medium' : 'text-slate-400'}>
                      {new Date(inv.dueDate).toLocaleDateString('fr-FR')}
                    </td>
                    <td>
                      <span className={`text-xs px-2.5 py-1 rounded-full ${cfg.cls}`}>{cfg.label}</span>
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-2">
                        {inv.status === 'draft' && role !== 'client' && (
                          <button onClick={() => updateStatus(inv.id, 'sent')}
                            className="p-1.5 rounded-lg hover:bg-blue-500/20 text-slate-500 hover:text-blue-400 transition-all" title="Envoyer">
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                        {(inv.status === 'sent' || inv.status === 'overdue') && role !== 'client' && (
                          <button onClick={() => updateStatus(inv.id, 'paid')}
                            className="p-1.5 rounded-lg hover:bg-green-500/20 text-slate-500 hover:text-green-400 transition-all" title="Marquer payée">
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button className="p-1.5 rounded-lg hover:bg-slate-500/20 text-slate-500 hover:text-slate-300 transition-all" title="Télécharger">
                          <Download className="w-4 h-4" />
                        </button>
                        {role !== 'client' && inv.status === 'draft' && (
                          <button onClick={() => deleteInvoice(inv.id)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-all" title="Supprimer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#2d3748]">
              <h2 className="text-lg font-semibold text-white">Nouvelle facture</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Client *</label>
                <select className="input-dark" value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}>
                  <option value="">Sélectionner un client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Description *</label>
                <input className="input-dark" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Séances de coaching (4x)" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Quantité</label>
                  <input className="input-dark" type="number" min="1" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: +e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Prix unitaire (€)</label>
                  <input className="input-dark" type="number" min="0" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: +e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Total</label>
                  <div className="input-dark flex items-center font-semibold text-white">{(form.quantity * form.unitPrice).toLocaleString('fr-FR')} €</div>
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Délai de paiement (jours)</label>
                <select className="input-dark" value={form.dueInDays} onChange={e => setForm(f => ({ ...f, dueInDays: +e.target.value }))}>
                  <option value={7}>7 jours</option>
                  <option value={14}>14 jours</option>
                  <option value={30}>30 jours</option>
                  <option value={45}>45 jours</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
                <textarea className="input-dark resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Informations complémentaires..." />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-[#2d3748]">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={handleCreate} disabled={!form.clientId || !form.description} className="btn-primary flex-1 disabled:opacity-50">
                Créer la facture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
