'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getAuth, getCoaches, getClients, getSessions, getInvoices, getPayments } from '@/lib/storage';
import { Coach, Client } from '@/lib/types';
import { Users, Dumbbell, CreditCard, TrendingUp, Star, Phone, Mail } from 'lucide-react';

export default function AdminPage() {
  const router = useRouter();
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState({ sessions: 0, revenue: 0, invoices: 0, pending: 0 });

  useEffect(() => {
    const auth = getAuth();
    if (!auth.isAuthenticated) { router.push('/'); return; }
    if (auth.role !== 'admin') { router.push('/dashboard'); return; }
    setCoaches(getCoaches());
    setClients(getClients());
    const sessions = getSessions();
    const invoices = getInvoices();
    const payments = getPayments();
    setStats({
      sessions: sessions.length,
      revenue: payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0),
      invoices: invoices.length,
      pending: invoices.filter(i => i.status === 'sent' || i.status === 'overdue').length,
    });
  }, [router]);

  return (
    <div className="flex min-h-screen bg-[#080d1a]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Administration</h1>
          <p className="text-slate-400 text-sm">Vue d&apos;ensemble de la plateforme CoachPro</p>
        </div>

        {/* Global stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Coachs actifs', value: coaches.length, icon: Dumbbell, color: 'bg-blue-500/20 text-blue-400' },
            { label: 'Clients total', value: clients.length, icon: Users, color: 'bg-purple-500/20 text-purple-400' },
            { label: 'Séances totales', value: stats.sessions, icon: TrendingUp, color: 'bg-cyan-500/20 text-cyan-400' },
            { label: 'Revenus plateforme', value: `${stats.revenue.toLocaleString('fr-FR')} €`, icon: CreditCard, color: 'bg-green-500/20 text-green-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card-dark">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{value}</div>
              <div className="text-sm text-slate-400">{label}</div>
            </div>
          ))}
        </div>

        {/* Coaches list */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-5">Coachs de la plateforme</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {coaches.map(coach => {
              const coachClients = clients.filter(c => c.coachId === coach.id);
              const activeClients = coachClients.filter(c => c.status === 'active').length;
              return (
                <div key={coach.id} className="card-dark">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                      {coach.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white">{coach.name}</h3>
                      <p className="text-xs text-slate-400">{coach.speciality}</p>
                      {coach.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-xs text-yellow-400">{coach.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{coach.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Phone className="w-3 h-3" />
                      <span>{coach.phone || 'Non renseigné'}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#2d3748]">
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{activeClients}</div>
                      <div className="text-xs text-slate-500">Clients actifs</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-white">{coach.sessionPrice || 0} €</div>
                      <div className="text-xs text-slate-500">/ séance</div>
                    </div>
                  </div>
                  {coach.iban && (
                    <div className="mt-3 pt-3 border-t border-[#2d3748]">
                      <div className="text-xs text-slate-500 mb-1">IBAN</div>
                      <div className="font-mono text-xs text-slate-400 break-all">{coach.iban}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Clients table */}
        <div className="card-dark p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2d3748] flex items-center justify-between">
            <h2 className="font-semibold text-white">Tous les clients</h2>
            <span className="text-sm text-slate-400">{clients.length} client{clients.length > 1 ? 's' : ''}</span>
          </div>
          <table className="w-full table-dark">
            <thead>
              <tr>
                <th className="text-left">Nom</th>
                <th className="text-left">Email</th>
                <th className="text-left">Coach</th>
                <th className="text-left">Objectif</th>
                <th className="text-left">Statut</th>
                <th className="text-left">Depuis</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => {
                const coach = coaches.find(c => c.id === client.coachId);
                return (
                  <tr key={client.id}>
                    <td className="font-medium text-white">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                          {client.name[0]}
                        </div>
                        {client.name}
                      </div>
                    </td>
                    <td className="text-slate-400 text-sm">{client.email}</td>
                    <td className="text-slate-300 text-sm">{coach?.name || '—'}</td>
                    <td className="text-slate-400 text-sm truncate max-w-32">{client.goal || '—'}</td>
                    <td>
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${
                        client.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                        client.status === 'inactive' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' :
                        'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                      }`}>
                        {client.status === 'active' ? 'Actif' : client.status === 'inactive' ? 'Inactif' : 'En attente'}
                      </span>
                    </td>
                    <td className="text-slate-500 text-sm">{new Date(client.startDate).toLocaleDateString('fr-FR')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
