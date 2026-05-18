'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import ProgressChart from '@/components/ProgressChart';
import { getAuth, getClientById, getCoachById, getSessions, getInvoices, getClientProgress, updateClient } from '@/lib/storage';
import { Client, Coach, Session, Invoice, ProgressMeasurement } from '@/lib/types';
import {
  ArrowLeft, Mail, Phone, MapPin, Target, Calendar, User,
  Edit2, Save, X, FileText, Clock, TrendingUp
} from 'lucide-react';

const statusConfig = {
  draft: { label: 'Brouillon', cls: 'badge-draft' },
  sent: { label: 'Envoyée', cls: 'badge-sent' },
  paid: { label: 'Payée', cls: 'badge-paid' },
  overdue: { label: 'En retard', cls: 'badge-overdue' },
};

const sessionStatusConfig = {
  scheduled: { label: 'Planifiée', color: 'text-blue-400' },
  completed: { label: 'Terminée', color: 'text-green-400' },
  cancelled: { label: 'Annulée', color: 'text-red-400' },
  no_show: { label: 'Absent', color: 'text-orange-400' },
};

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [client, setClient] = useState<Client | null>(null);
  const [coach, setCoach] = useState<Coach | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [progressData, setProgressData] = useState<ProgressMeasurement[]>([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<Client>>({});
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'invoices' | 'progress'>('overview');

  useEffect(() => {
    const auth = getAuth();
    if (!auth.isAuthenticated) { router.push('/'); return; }

    const c = getClientById(id);
    if (!c) { router.push('/clients'); return; }
    setClient(c);
    setForm(c);

    const coachData = getCoachById(c.coachId);
    if (coachData) setCoach(coachData);

    const allSessions = getSessions().filter(s => s.clientId === id)
      .sort((a, b) => b.date.localeCompare(a.date));
    setSessions(allSessions);

    const allInvoices = getInvoices().filter(i => i.clientId === id)
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate));
    setInvoices(allInvoices);

    setProgressData(getClientProgress(id));
  }, [id, router]);

  const handleSave = () => {
    if (!client || !form.name || !form.email) return;
    const updated = { ...client, ...form } as Client;
    updateClient(updated);
    setClient(updated);
    setEditing(false);
  };

  if (!client) {
    return (
      <div className="flex h-screen bg-slate-950 items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const completedSessions = sessions.filter(s => s.status === 'completed').length;
  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.total, 0);
  const latestProgress = progressData[progressData.length - 1];

  const tabs = [
    { key: 'overview', label: 'Vue d\'ensemble' },
    { key: 'sessions', label: `Séances (${sessions.length})` },
    { key: 'invoices', label: `Factures (${invoices.length})` },
    { key: 'progress', label: 'Progression' },
  ];

  return (
    <div className="flex h-screen bg-slate-950 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 px-6 py-4">
          <Link href="/clients" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Retour aux clients
          </Link>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white shadow-lg">
                {getInitials(client.name)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{client.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                    client.status === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                    client.status === 'inactive' ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' :
                    'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                  }`}>
                    {client.status === 'active' ? 'Actif' : client.status === 'inactive' ? 'Inactif' : 'En attente'}
                  </span>
                  {coach && <span className="text-sm text-slate-400">Coach : {coach.name}</span>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <button onClick={() => setEditing(false)} className="btn-secondary">
                    <X className="w-4 h-4" /> Annuler
                  </button>
                  <button onClick={handleSave} className="btn-primary">
                    <Save className="w-4 h-4" /> Sauvegarder
                  </button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} className="btn-secondary">
                  <Edit2 className="w-4 h-4" /> Modifier
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="bg-slate-800/30 border-b border-slate-800 px-6 py-3">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-400">Depuis le</span>
              <span className="text-sm font-medium text-white">
                {new Date(client.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-400">{completedSessions} séances effectuées</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-500" />
              <span className="text-sm text-slate-400">{totalPaid.toLocaleString('fr-FR')} € encaissés</span>
            </div>
            {latestProgress?.weight && (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-400">{latestProgress.weight} kg</span>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-slate-900 border-b border-slate-800 px-6">
          <div className="flex gap-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto p-6">
          {/* Overview tab */}
          {activeTab === 'overview' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal info */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Informations personnelles</h3>
                  {editing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Nom</label>
                        <input className="input-dark" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Email</label>
                        <input className="input-dark" type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Téléphone</label>
                        <input className="input-dark" value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Date de naissance</label>
                        <input className="input-dark" type="date" value={form.dateOfBirth || ''} onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Adresse</label>
                        <input className="input-dark" value={form.address || ''} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Statut</label>
                        <select className="input-dark" value={form.status || 'active'} onChange={e => setForm(f => ({ ...f, status: e.target.value as Client['status'] }))}>
                          <option value="active">Actif</option>
                          <option value="pending">En attente</option>
                          <option value="inactive">Inactif</option>
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {[
                        { icon: Mail, label: client.email },
                        { icon: Phone, label: client.phone || 'Non renseigné' },
                        { icon: MapPin, label: client.address || 'Non renseignée' },
                        { icon: User, label: client.dateOfBirth ? new Date(client.dateOfBirth).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Non renseignée' },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <item.icon className="w-4 h-4 text-slate-500 flex-shrink-0" />
                          <span className="text-sm text-slate-300">{item.label}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Goal & notes */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">Objectif & Notes</h3>
                  {editing ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Objectif</label>
                        <input className="input-dark" value={form.goal || ''} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} placeholder="Objectif du client" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Notes médicales</label>
                        <textarea className="input-dark resize-none" rows={3} value={form.medicalNotes || ''} onChange={e => setForm(f => ({ ...f, medicalNotes: e.target.value }))} placeholder="Informations médicales importantes..." />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Contact d'urgence</label>
                        <input className="input-dark" value={form.emergencyContact || ''} onChange={e => setForm(f => ({ ...f, emergencyContact: e.target.value }))} placeholder="Nom et téléphone" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-blue-400" />
                          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Objectif</span>
                        </div>
                        <p className="text-sm text-white bg-slate-900/50 rounded-lg p-3">
                          {client.goal || 'Non défini'}
                        </p>
                      </div>
                      {client.medicalNotes && (
                        <div>
                          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Notes médicales</div>
                          <p className="text-sm text-slate-300 bg-slate-900/50 rounded-lg p-3">{client.medicalNotes}</p>
                        </div>
                      )}
                      {client.emergencyContact && (
                        <div>
                          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider mb-2">Contact d'urgence</div>
                          <p className="text-sm text-slate-300">{client.emergencyContact}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Latest measurements */}
              {latestProgress && (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">
                    Dernières mesures — {new Date(latestProgress.date).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
                    {[
                      { label: 'Poids', value: latestProgress.weight, unit: 'kg' },
                      { label: 'Masse grasse', value: latestProgress.bodyFat, unit: '%' },
                      { label: 'Poitrine', value: latestProgress.chest, unit: 'cm' },
                      { label: 'Taille', value: latestProgress.waist, unit: 'cm' },
                      { label: 'Hanches', value: latestProgress.hips, unit: 'cm' },
                      { label: 'Biceps', value: latestProgress.biceps, unit: 'cm' },
                      { label: 'Cuisses', value: latestProgress.thighs, unit: 'cm' },
                    ].map((m, i) => m.value !== undefined && (
                      <div key={i} className="bg-slate-900/50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-white">{m.value}</div>
                        <div className="text-xs text-slate-500">{m.unit}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sessions tab */}
          {activeTab === 'sessions' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-slate-700">
                  <h3 className="font-semibold text-white">Historique des séances</h3>
                </div>
                {sessions.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Aucune séance enregistrée</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-700/50">
                    {sessions.map(session => {
                      const cfg = sessionStatusConfig[session.status];
                      return (
                        <div key={session.id} className="p-4 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-700 flex flex-col items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-white">
                              {new Date(session.date).getDate()}
                            </span>
                            <span className="text-xs text-slate-400 uppercase">
                              {new Date(session.date).toLocaleDateString('fr-FR', { month: 'short' })}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-medium text-white">
                                {session.type === 'individual' ? 'Séance individuelle' : session.type === 'group' ? 'Cours collectif' : 'Séance en ligne'}
                              </span>
                              <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
                            </div>
                            <div className="text-xs text-slate-400">
                              {session.startTime} – {session.endTime}
                              {session.location && ` · ${session.location}`}
                            </div>
                            {session.notes && <div className="text-xs text-slate-500 mt-1 italic">{session.notes}</div>}
                          </div>
                          {session.price && (
                            <span className="text-sm font-semibold text-white">{session.price} €</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Invoices tab */}
          {activeTab === 'invoices' && (
            <div className="max-w-4xl mx-auto animate-fade-in">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
                <div className="p-5 border-b border-slate-700">
                  <h3 className="font-semibold text-white">Factures du client</h3>
                </div>
                {invoices.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p>Aucune facture</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full table-dark">
                      <thead>
                        <tr>
                          <th className="text-left">Numéro</th>
                          <th className="text-left">Date</th>
                          <th className="text-left">Échéance</th>
                          <th className="text-right">Montant</th>
                          <th className="text-left">Statut</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices.map(inv => {
                          const cfg = statusConfig[inv.status];
                          return (
                            <tr key={inv.id}>
                              <td className="font-mono text-xs text-blue-400">{inv.number}</td>
                              <td className="text-slate-400">{new Date(inv.issueDate).toLocaleDateString('fr-FR')}</td>
                              <td className="text-slate-400">{new Date(inv.dueDate).toLocaleDateString('fr-FR')}</td>
                              <td className="text-right font-semibold text-white">{inv.total.toLocaleString('fr-FR')} €</td>
                              <td><span className={`text-xs px-2.5 py-1 rounded-full ${cfg.cls}`}>{cfg.label}</span></td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress tab */}
          {activeTab === 'progress' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
              {progressData.length === 0 ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center text-slate-500">
                  <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>Aucune donnée de progression</p>
                </div>
              ) : (
                <>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <h3 className="font-semibold text-white mb-4">Évolution du poids (kg)</h3>
                    <ProgressChart data={progressData} metric="weight" />
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <h3 className="font-semibold text-white mb-4">Taux de masse grasse (%)</h3>
                    <ProgressChart data={progressData} metric="bodyFat" />
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                    <h3 className="font-semibold text-white mb-4">Mensurations (cm)</h3>
                    <ProgressChart data={progressData} metric="measurements" />
                  </div>
                </>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
