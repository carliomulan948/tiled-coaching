'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { getAuth, getClients, saveClients, getCoaches } from '@/lib/storage';
import { Client, Coach } from '@/lib/types';
import { Plus, Search, Phone, Mail, Target, X } from 'lucide-react';

const statusLabel = { active: 'Actif', inactive: 'Inactif', pending: 'En attente' };
const statusStyle = {
  active: 'bg-green-500/20 text-green-400 border-green-500/30',
  inactive: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export default function ClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');
  const [showModal, setShowModal] = useState(false);
  const [coachId, setCoachId] = useState('coach-1');
  const [form, setForm] = useState({
    name: '', email: '', phone: '', goal: '', dateOfBirth: '', address: '', status: 'active' as Client['status'],
  });

  useEffect(() => {
    const auth = getAuth();
    if (!auth.isAuthenticated) { router.push('/'); return; }
    if (auth.role === 'client') { router.push('/dashboard'); return; }
    const allClients = getClients();
    const allCoaches = getCoaches();
    setCoaches(allCoaches);
    if (auth.role === 'coach') {
      setCoachId(auth.user?.id || 'coach-1');
      setClients(allClients.filter(c => c.coachId === auth.user?.id));
    } else {
      setClients(allClients);
    }
  }, [router]);

  const filtered = clients.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.status === filter;
    return matchSearch && matchFilter;
  });

  const handleAdd = () => {
    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: form.name,
      email: form.email,
      phone: form.phone,
      goal: form.goal,
      dateOfBirth: form.dateOfBirth,
      address: form.address,
      status: form.status,
      coachId,
      role: 'client',
      startDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
    };
    const all = getClients();
    all.push(newClient);
    saveClients(all);
    setClients(prev => [...prev, newClient]);
    setShowModal(false);
    setForm({ name: '', email: '', phone: '', goal: '', dateOfBirth: '', address: '', status: 'active' });
  };

  return (
    <div className="flex min-h-screen bg-[#080d1a]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Clients</h1>
            <p className="text-slate-400 text-sm">{clients.length} client{clients.length > 1 ? 's' : ''} au total</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Ajouter un client
          </button>
        </div>

        {/* Search & filter */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input-dark pl-10"
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'inactive', 'pending'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                  filter === f ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-[#1e2433] text-slate-400 border-[#2d3748] hover:border-slate-500'
                }`}>
                {f === 'all' ? 'Tous' : statusLabel[f]}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Aucun client trouvé</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(client => {
              const coach = coaches.find(c => c.id === client.coachId);
              return (
                <Link key={client.id} href={`/clients/${client.id}`}
                  className="card-dark hover:border-blue-500/30 transition-all group cursor-pointer block">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                      {client.name[0]}
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full border ${statusStyle[client.status]}`}>
                      {statusLabel[client.status]}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white group-hover:text-blue-300 transition-colors mb-1">{client.name}</h3>
                  {coach && <p className="text-xs text-slate-500 mb-3">Coach : {coach.name}</p>}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Phone className="w-3 h-3 flex-shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.goal && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Target className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{client.goal}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#2d3748] text-xs text-slate-600">
                    Depuis le {new Date(client.startDate).toLocaleDateString('fr-FR')}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      {/* Add client modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#2d3748]">
              <h2 className="text-lg font-semibold text-white">Nouveau client</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Nom complet *</label>
                  <input className="input-dark" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Jean Dupont" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Email *</label>
                  <input className="input-dark" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jean@email.fr" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Téléphone</label>
                  <input className="input-dark" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+33 6 12 34 56 78" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Date de naissance</label>
                  <input className="input-dark" type="date" value={form.dateOfBirth} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Objectif</label>
                <input className="input-dark" value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} placeholder="Prise de masse, perte de poids..." />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Adresse</label>
                <input className="input-dark" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="12 rue de la Paix, 75001 Paris" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Statut</label>
                <select className="input-dark" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Client['status'] }))}>
                  <option value="active">Actif</option>
                  <option value="pending">En attente</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-[#2d3748]">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={handleAdd} disabled={!form.name || !form.email} className="btn-primary flex-1 disabled:opacity-50">
                Ajouter le client
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Users({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
