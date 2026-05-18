'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getAuth, getSessions, saveSessions, getClients } from '@/lib/storage';
import { Session, Client } from '@/lib/types';
import { ChevronLeft, ChevronRight, Plus, X, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const statusConfig = {
  scheduled: { label: 'Planifiée', icon: Clock, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  completed: { label: 'Terminée', icon: CheckCircle2, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelled: { label: 'Annulée', icon: XCircle, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  no_show: { label: 'Absent', icon: AlertCircle, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
};

const sessionColors = ['bg-blue-500/30 border-blue-500/50', 'bg-purple-500/30 border-purple-500/50', 'bg-cyan-500/30 border-cyan-500/50', 'bg-pink-500/30 border-pink-500/50'];

function getWeekDates(baseDate: Date): Date[] {
  const day = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export default function SchedulePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [weekBase, setWeekBase] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [coachId, setCoachId] = useState('coach-1');
  const [role, setRole] = useState('coach');
  const [form, setForm] = useState({
    clientId: '', date: new Date().toISOString().split('T')[0],
    startTime: '09:00', endTime: '10:00', type: 'individual' as Session['type'],
    location: '', notes: '', price: 65,
  });

  useEffect(() => {
    const auth = getAuth();
    if (!auth.isAuthenticated) { router.push('/'); return; }
    setRole(auth.role || 'coach');
    const cid = auth.user?.id || 'coach-1';
    setCoachId(cid);
    const allClients = getClients();
    const allSessions = getSessions();
    if (auth.role === 'coach') {
      setClients(allClients.filter(c => c.coachId === cid));
      setSessions(allSessions.filter(s => s.coachId === cid));
    } else if (auth.role === 'client') {
      setSessions(allSessions.filter(s => s.clientId === auth.user?.id));
      setClients(allClients.filter(c => c.id === auth.user?.id));
    } else {
      setClients(allClients);
      setSessions(allSessions);
    }
  }, [router]);

  const weekDates = getWeekDates(weekBase);

  const prevWeek = () => { const d = new Date(weekBase); d.setDate(d.getDate() - 7); setWeekBase(d); };
  const nextWeek = () => { const d = new Date(weekBase); d.setDate(d.getDate() + 7); setWeekBase(d); };
  const goToday = () => setWeekBase(new Date());

  const getDateStr = (d: Date) => d.toISOString().split('T')[0];
  const today = getDateStr(new Date());

  const handleAdd = () => {
    const newSession: Session = {
      id: `session-${Date.now()}`,
      coachId, clientId: form.clientId, date: form.date,
      startTime: form.startTime, endTime: form.endTime,
      type: form.type, status: 'scheduled', location: form.location,
      notes: form.notes, price: form.price,
    };
    const all = getSessions();
    all.push(newSession);
    saveSessions(all);
    setSessions(prev => [...prev, newSession]);
    setShowModal(false);
  };

  const updateSessionStatus = (id: string, status: Session['status']) => {
    const all = getSessions().map(s => s.id === id ? { ...s, status } : s);
    saveSessions(all);
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const monthLabel = `${MONTHS_FR[weekDates[0].getMonth()]} ${weekDates[0].getFullYear()}`;

  const upcomingSessions = sessions
    .filter(s => s.date >= today && s.status === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .slice(0, 10);

  return (
    <div className="flex min-h-screen bg-[#080d1a]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Emploi du temps</h1>
            <p className="text-slate-400 text-sm">{sessions.filter(s => s.status === 'scheduled').length} séance{sessions.filter(s => s.status === 'scheduled').length > 1 ? 's' : ''} planifiée{sessions.filter(s => s.status === 'scheduled').length > 1 ? 's' : ''}</p>
          </div>
          {role !== 'client' && (
            <button onClick={() => setShowModal(true)} className="btn-primary">
              <Plus className="w-4 h-4" /> Planifier une séance
            </button>
          )}
        </div>

        {/* Week navigation */}
        <div className="card-dark mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-[#2d3748] text-slate-400 hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-white min-w-40 text-center">{monthLabel}</span>
              <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-[#2d3748] text-slate-400 hover:text-white transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button onClick={goToday} className="btn-secondary text-xs px-3 py-1.5">Aujourd&apos;hui</button>
          </div>

          {/* Week grid */}
          <div className="grid grid-cols-7 gap-2">
            {weekDates.map((date, idx) => {
              const dateStr = getDateStr(date);
              const isToday = dateStr === today;
              const daySessions = sessions.filter(s => s.date === dateStr).sort((a, b) => a.startTime.localeCompare(b.startTime));
              return (
                <div key={idx} className={`min-h-32 p-2 rounded-xl border ${isToday ? 'border-blue-500/50 bg-blue-500/5' : 'border-[#2d3748] bg-[#0f172a]'}`}>
                  <div className="text-center mb-2">
                    <div className="text-xs text-slate-500 font-medium">{DAYS_FR[date.getDay()]}</div>
                    <div className={`text-sm font-bold mt-0.5 w-7 h-7 rounded-full flex items-center justify-center mx-auto ${isToday ? 'bg-blue-500 text-white' : 'text-slate-300'}`}>
                      {date.getDate()}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {daySessions.map((session, i) => {
                      const client = clients.find(c => c.id === session.clientId);
                      const colorCls = sessionColors[i % sessionColors.length];
                      const cfg = statusConfig[session.status];
                      return (
                        <div key={session.id}
                          className={`text-xs p-1.5 rounded-lg border ${colorCls} cursor-pointer hover:opacity-90 transition-opacity`}
                          title={`${client?.name} — ${session.startTime}`}>
                          <div className="font-medium text-white truncate">{client?.name?.split(' ')[0] || '?'}</div>
                          <div className="text-[10px] opacity-70">{session.startTime}</div>
                          <div className={`text-[10px] mt-0.5 ${cfg.color.split(' ')[1]}`}>{cfg.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming sessions list */}
        <div className="card-dark">
          <h2 className="font-semibold text-white mb-5">Prochaines séances</h2>
          {upcomingSessions.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-8">Aucune séance planifiée</p>
          ) : (
            <div className="space-y-3">
              {upcomingSessions.map(session => {
                const client = clients.find(c => c.id === session.clientId);
                const cfg = statusConfig[session.status];
                return (
                  <div key={session.id} className="flex items-center gap-4 p-4 rounded-xl bg-[#0f172a] border border-[#2d3748]">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
                      {client?.name?.[0] || '?'}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{client?.name || 'Inconnu'}</div>
                      <div className="text-xs text-slate-400">
                        {new Date(session.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} · {session.startTime}–{session.endTime}
                        {session.location && ` · ${session.location}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.price && <span className="text-sm font-medium text-white">{session.price} €</span>}
                      <span className={`text-xs px-2.5 py-1 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                      {role !== 'client' && session.status === 'scheduled' && (
                        <button onClick={() => updateSessionStatus(session.id, 'completed')}
                          className="text-xs px-2.5 py-1 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors">
                          Marquer terminée
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#2d3748]">
              <h2 className="text-lg font-semibold text-white">Planifier une séance</h2>
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
                <label className="block text-xs text-slate-400 mb-1.5">Date *</label>
                <input className="input-dark" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Heure début</label>
                  <input className="input-dark" type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Heure fin</label>
                  <input className="input-dark" type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Type</label>
                  <select className="input-dark" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Session['type'] }))}>
                    <option value="individual">Individuelle</option>
                    <option value="group">Groupe</option>
                    <option value="online">En ligne</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Prix (€)</label>
                  <input className="input-dark" type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Lieu</label>
                <input className="input-dark" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Salle de sport, en ligne..." />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
                <textarea className="input-dark resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Objectifs de la séance..." />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-[#2d3748]">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={handleAdd} disabled={!form.clientId || !form.date} className="btn-primary flex-1 disabled:opacity-50">
                Planifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
