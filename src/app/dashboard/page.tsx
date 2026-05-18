'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getAuth, getClients, getSessions, getInvoices, getPayments } from '@/lib/storage';
import { Client, Session, Invoice } from '@/lib/types';
import { Users, TrendingUp, Calendar, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';

function StatCard({ title, value, subtitle, icon: Icon, color }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="card-dark">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-slate-400">{title}</div>
      {subtitle && <div className="text-xs text-slate-600 mt-1">{subtitle}</div>}
    </div>
  );
}

const statusConfig = {
  scheduled: { label: 'Planifiée', icon: Clock, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  completed: { label: 'Terminée', icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10' },
  cancelled: { label: 'Annulée', icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10' },
  no_show: { label: 'Absent', icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
};

const invoiceStatusConfig = {
  draft: { label: 'Brouillon', color: 'badge-draft' },
  sent: { label: 'Envoyée', color: 'badge-sent' },
  paid: { label: 'Payée', color: 'badge-paid' },
  overdue: { label: 'En retard', color: 'badge-overdue' },
};

export default function DashboardPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [coachId, setCoachId] = useState<string | null>(null);
  const [role, setRole] = useState<string>('coach');

  useEffect(() => {
    const auth = getAuth();
    if (!auth.isAuthenticated) { router.push('/'); return; }
    setRole(auth.role || 'coach');

    const allClients = getClients();
    const allSessions = getSessions();
    const allInvoices = getInvoices();

    if (auth.role === 'coach') {
      setCoachId(auth.user?.id || null);
      setClients(allClients.filter(c => c.coachId === auth.user?.id));
      setSessions(allSessions.filter(s => s.coachId === auth.user?.id));
      setInvoices(allInvoices.filter(i => i.coachId === auth.user?.id));
    } else if (auth.role === 'client') {
      setClients([allClients.find(c => c.id === auth.user?.id)!].filter(Boolean));
      setSessions(allSessions.filter(s => s.clientId === auth.user?.id));
      setInvoices(allInvoices.filter(i => i.clientId === auth.user?.id));
    } else {
      setClients(allClients);
      setSessions(allSessions);
      setInvoices(allInvoices);
    }
  }, [router]);

  const today = new Date().toISOString().split('T')[0];
  const weekEnd = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
  const sessionsThisWeek = sessions.filter(s => s.date >= today && s.date <= weekEnd && s.status === 'scheduled');
  const pendingInvoices = invoices.filter(i => i.status === 'sent' || i.status === 'overdue');
  const revenue = getPayments().filter(p => p.status === 'completed' && (coachId ? p.coachId === coachId : true)).reduce((sum, p) => sum + p.amount, 0);
  const activeClients = clients.filter(c => c.status === 'active');
  const upcomingSessions = sessions.filter(s => s.date >= today && s.status === 'scheduled').slice(0, 5);
  const recentInvoices = [...invoices].sort((a, b) => b.issueDate.localeCompare(a.issueDate)).slice(0, 5);
  const recentClients = [...clients].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4);

  return (
    <div className="flex min-h-screen bg-[#080d1a]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Tableau de bord</h1>
          <p className="text-slate-400 text-sm">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Clients actifs" value={activeClients.length} subtitle={`${clients.length} au total`} icon={Users} color="bg-blue-500/20 text-blue-400" />
          <StatCard title="Revenus totaux" value={`${revenue.toLocaleString('fr-FR')} €`} subtitle="Paiements reçus" icon={TrendingUp} color="bg-green-500/20 text-green-400" />
          <StatCard title="Séances cette semaine" value={sessionsThisWeek.length} subtitle="À venir" icon={Calendar} color="bg-purple-500/20 text-purple-400" />
          <StatCard title="Factures en attente" value={pendingInvoices.length} subtitle={`${pendingInvoices.filter(i => i.status === 'overdue').length} en retard`} icon={AlertCircle} color="bg-orange-500/20 text-orange-400" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming sessions */}
          <div className="lg:col-span-2 card-dark">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Prochaines séances</h2>
              <Link href="/schedule" className="text-xs text-blue-400 hover:text-blue-300">Voir tout →</Link>
            </div>
            {upcomingSessions.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">Aucune séance planifiée</p>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map(session => {
                  const cfg = statusConfig[session.status];
                  const client = clients.find(c => c.id === session.clientId);
                  return (
                    <div key={session.id} className="flex items-center gap-4 p-3 rounded-lg bg-[#0f172a] border border-[#2d3748]">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-sm font-bold text-blue-400 flex-shrink-0">
                        {client?.name?.[0] || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white">{client?.name || 'Client inconnu'}</div>
                        <div className="text-xs text-slate-400">
                          {new Date(session.date).toLocaleDateString('fr-FR', { weekday: 'short', month: 'short', day: 'numeric' })} · {session.startTime} - {session.endTime}
                        </div>
                      </div>
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                        <cfg.icon className="w-3 h-3" />
                        {cfg.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent invoices */}
          <div className="card-dark">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Factures récentes</h2>
              <Link href="/invoices" className="text-xs text-blue-400 hover:text-blue-300">Voir tout →</Link>
            </div>
            <div className="space-y-3">
              {recentInvoices.map(inv => {
                const cfg = invoiceStatusConfig[inv.status];
                return (
                  <div key={inv.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white truncate">{inv.clientName}</div>
                      <div className="text-xs text-slate-500">{inv.number}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-sm font-semibold text-white">{inv.total} €</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Recent clients */}
        {role !== 'client' && recentClients.length > 0 && (
          <div className="mt-6 card-dark">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-white">Clients récents</h2>
              <Link href="/clients" className="text-xs text-blue-400 hover:text-blue-300">Voir tous →</Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {recentClients.map(client => (
                <Link key={client.id} href={`/clients/${client.id}`}
                  className="p-4 rounded-xl bg-[#0f172a] border border-[#2d3748] hover:border-blue-500/30 transition-all group">
                  <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                    {client.name[0]}
                  </div>
                  <div className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors truncate">{client.name}</div>
                  <div className="text-xs text-slate-500 truncate mt-0.5">{client.goal}</div>
                  <div className={`mt-2 text-xs px-2 py-0.5 rounded-full inline-block ${
                    client.status === 'active' ? 'bg-green-500/20 text-green-400' :
                    client.status === 'inactive' ? 'bg-slate-500/20 text-slate-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {client.status === 'active' ? 'Actif' : client.status === 'inactive' ? 'Inactif' : 'En attente'}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
