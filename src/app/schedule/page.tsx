'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getAuth, getSessions, saveSessions, getClients } from '@/lib/storage';
import { Session, Client } from '@/lib/types';
import {
  ChevronLeft, ChevronRight, Plus, X, CheckCircle2, Clock,
  XCircle, AlertCircle, Users, Phone, Mail, MapPin,
  Calendar, Target, User, ChevronDown
} from 'lucide-react';

const DAYS_FR = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const DAYS_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const statusConfig = {
  scheduled: { label: 'Planifiée', icon: Clock, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  completed: { label: 'Terminée', icon: CheckCircle2, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelled: { label: 'Annulée', icon: XCircle, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  no_show: { label: 'Absent', icon: AlertCircle, color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
};

const typeConfig = {
  individual: { label: 'Individuelle', color: 'bg-blue-500/30 border-blue-500/50 text-blue-300' },
  group: { label: 'Groupe', color: 'bg-purple-500/30 border-purple-500/50 text-purple-300' },
  online: { label: 'En ligne', color: 'bg-cyan-500/30 border-cyan-500/50 text-cyan-300' },
};

function getAge(dateOfBirth?: string): string {
  if (!dateOfBirth) return '—';
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return `${age} ans`;
}

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

function getSessionParticipants(session: Session, clients: Client[]): Client[] {
  const seen: Record<string, boolean> = {};
  const ids: string[] = [];
  if (session.clientId) { seen[session.clientId] = true; ids.push(session.clientId); }
  session.participantIds?.forEach(id => { if (!seen[id]) { seen[id] = true; ids.push(id); } });
  return ids.map(id => clients.find(c => c.id === id)).filter(Boolean) as Client[];
}

interface SessionDetailProps {
  session: Session;
  clients: Client[];
  role: string;
  onClose: () => void;
  onStatusChange: (id: string, status: Session['status']) => void;
}

function SessionDetail({ session, clients, role, onClose, onStatusChange }: SessionDetailProps) {
  const participants = getSessionParticipants(session, clients);
  const cfg = statusConfig[session.status];
  const tcfg = typeConfig[session.type];
  const StatusIcon = cfg.icon;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-slate-800">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${tcfg.color}`}>{tcfg.label}</span>
              <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border font-medium ${cfg.color}`}>
                <StatusIcon className="w-3 h-3" />
                {cfg.label}
              </span>
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                <Users className="w-3 h-3" />
                {participants.length} participant{participants.length > 1 ? 's' : ''}
                {session.maxParticipants ? ` / ${session.maxParticipants}` : ''}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white">
              {session.title || (participants[0]?.name ?? 'Séance')}
            </h3>
            <div className="flex items-center gap-4 mt-1 text-sm text-slate-400 flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(session.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {session.startTime} – {session.endTime}
              </span>
              {session.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {session.location}
                </span>
              )}
              {session.price && (
                <span className="font-semibold text-white">{session.price} €</span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors ml-4 flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Participants */}
        <div className="flex-1 overflow-y-auto p-6">
          <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Inscrits ({participants.length})
          </h4>

          {participants.length === 0 ? (
            <p className="text-slate-500 text-sm">Aucun participant enregistré</p>
          ) : (
            <div className="space-y-3">
              {participants.map((client, idx) => (
                <div key={client.id} className="bg-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
                      {client.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white">{client.name}</div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {getAge(client.dateOfBirth)}
                        </span>
                        {client.status && (
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            client.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            client.status === 'inactive' ? 'bg-red-500/20 text-red-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {client.status === 'active' ? 'Actif' : client.status === 'inactive' ? 'Inactif' : 'En attente'}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-slate-600">#{idx + 1}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    {client.phone && (
                      <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-slate-300 hover:text-blue-400 transition-colors">
                        <Phone className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{client.phone}</span>
                      </a>
                    )}
                    {client.email && (
                      <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-slate-300 hover:text-blue-400 transition-colors">
                        <Mail className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                        <span className="truncate">{client.email}</span>
                      </a>
                    )}
                    {client.goal && (
                      <div className="flex items-start gap-2 text-slate-300 sm:col-span-2">
                        <Target className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-400">{client.goal}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-start gap-2 text-slate-300 sm:col-span-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-slate-400">{client.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {session.notes && (
            <div className="mt-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <p className="text-xs text-slate-500 mb-1">Notes</p>
              <p className="text-sm text-slate-300">{session.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        {role !== 'client' && session.status === 'scheduled' && (
          <div className="p-4 border-t border-slate-800 flex gap-2 flex-wrap">
            <button
              onClick={() => { onStatusChange(session.id, 'completed'); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" /> Marquer terminée
            </button>
            <button
              onClick={() => { onStatusChange(session.id, 'no_show'); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-sm hover:bg-orange-500/30 transition-colors"
            >
              <AlertCircle className="w-4 h-4" /> Absent
            </button>
            <button
              onClick={() => { onStatusChange(session.id, 'cancelled'); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
            >
              <XCircle className="w-4 h-4" /> Annuler
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SchedulePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [weekBase, setWeekBase] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [coachId, setCoachId] = useState('coach-1');
  const [role, setRole] = useState('coach');
  const [form, setForm] = useState({
    clientId: '',
    participantIds: [] as string[],
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00', endTime: '10:00',
    type: 'individual' as Session['type'],
    location: '', notes: '', price: 65,
    maxParticipants: 10,
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
      setSessions(allSessions.filter(s =>
        s.clientId === auth.user?.id || s.participantIds?.includes(auth.user?.id ?? '')
      ));
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
    const isGroup = form.type === 'group';
    const newSession: Session = {
      id: `session-${Date.now()}`,
      coachId,
      clientId: form.type === 'individual' ? form.clientId : (form.participantIds[0] ?? ''),
      participantIds: isGroup ? form.participantIds : undefined,
      title: isGroup && form.title ? form.title : undefined,
      maxParticipants: isGroup ? form.maxParticipants : undefined,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      type: form.type,
      status: 'scheduled',
      location: form.location,
      notes: form.notes,
      price: form.price,
    };
    const all = getSessions();
    all.push(newSession);
    saveSessions(all);
    setSessions(prev => [...prev, newSession]);
    setShowModal(false);
    setForm(f => ({ ...f, clientId: '', participantIds: [], title: '' }));
  };

  const updateSessionStatus = (id: string, status: Session['status']) => {
    const all = getSessions().map(s => s.id === id ? { ...s, status } : s);
    saveSessions(all);
    setSessions(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const toggleParticipant = (id: string) => {
    setForm(f => ({
      ...f,
      participantIds: f.participantIds.includes(id)
        ? f.participantIds.filter(p => p !== id)
        : [...f.participantIds, id]
    }));
  };

  const weekLabel = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    if (start.getMonth() === end.getMonth()) {
      return `${start.getDate()} – ${end.getDate()} ${MONTHS_FR[end.getMonth()]} ${end.getFullYear()}`;
    }
    return `${start.getDate()} ${MONTHS_FR[start.getMonth()]} – ${end.getDate()} ${MONTHS_FR[end.getMonth()]} ${end.getFullYear()}`;
  };

  const upcomingSessions = sessions
    .filter(s => s.date >= today && s.status === 'scheduled')
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
    .slice(0, 12);

  const totalThisWeek = sessions.filter(s => {
    const d = getDateStr(new Date(s.date));
    return d >= getDateStr(weekDates[0]) && d <= getDateStr(weekDates[6]);
  }).length;

  return (
    <div className="flex min-h-screen bg-[#080d1a]">
      <Sidebar />
      <main className="flex-1 p-4 md:p-8 overflow-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Planning</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {sessions.filter(s => s.status === 'scheduled').length} séance{sessions.filter(s => s.status === 'scheduled').length > 1 ? 's' : ''} planifiée{sessions.filter(s => s.status === 'scheduled').length > 1 ? 's' : ''} · {totalThisWeek} cette semaine
            </p>
          </div>
          {role !== 'client' && (
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-xl hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Planifier
            </button>
          )}
        </div>

        {/* Week calendar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl mb-6 overflow-hidden">
          {/* Week nav */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-white text-sm min-w-52 text-center">{weekLabel()}</span>
              <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <button onClick={goToday} className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700">
              Aujourd&apos;hui
            </button>
          </div>

          {/* Days */}
          <div className="grid grid-cols-7">
            {weekDates.map((date, idx) => {
              const dateStr = getDateStr(date);
              const isToday = dateStr === today;
              const daySessions = sessions
                .filter(s => s.date === dateStr)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              return (
                <div
                  key={idx}
                  className={`min-h-36 p-2 border-r border-slate-800 last:border-r-0 ${isToday ? 'bg-blue-500/5' : ''}`}
                >
                  {/* Day header */}
                  <div className="text-center mb-2">
                    <div className="text-xs text-slate-500 font-medium">{DAYS_FR[date.getDay()]}</div>
                    <div className={`text-sm font-bold mt-0.5 w-7 h-7 rounded-full flex items-center justify-center mx-auto transition-colors ${
                      isToday ? 'bg-blue-500 text-white' : 'text-slate-300'
                    }`}>
                      {date.getDate()}
                    </div>
                  </div>

                  {/* Sessions */}
                  <div className="space-y-1">
                    {daySessions.map(session => {
                      const participants = getSessionParticipants(session, clients);
                      const tcfg = typeConfig[session.type];
                      const scfg = statusConfig[session.status];
                      const label = session.title || participants[0]?.name?.split(' ')[0] || '?';
                      return (
                        <button
                          key={session.id}
                          onClick={() => setSelectedSession(session)}
                          className={`w-full text-left text-xs p-1.5 rounded-lg border ${tcfg.color} hover:opacity-80 transition-opacity`}
                        >
                          <div className="font-semibold truncate">{label}</div>
                          <div className="opacity-75 text-[10px]">{session.startTime}</div>
                          {participants.length > 1 && (
                            <div className="flex items-center gap-0.5 mt-0.5 text-[10px] opacity-75">
                              <Users className="w-2.5 h-2.5" />
                              {participants.length}
                            </div>
                          )}
                          {session.status !== 'scheduled' && (
                            <div className={`text-[10px] mt-0.5 ${scfg.color.split(' ')[1]}`}>{scfg.label}</div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming sessions */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
            <h2 className="font-semibold text-white">Prochaines séances</h2>
            <span className="text-xs text-slate-500">{upcomingSessions.length} à venir</span>
          </div>
          {upcomingSessions.length === 0 ? (
            <p className="text-slate-500 text-sm text-center py-10">Aucune séance planifiée</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {upcomingSessions.map(session => {
                const participants = getSessionParticipants(session, clients);
                const cfg = statusConfig[session.status];
                const tcfg = typeConfig[session.type];
                const label = session.title || participants[0]?.name || 'Séance';
                return (
                  <button
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-slate-800/50 transition-colors text-left"
                  >
                    {/* Avatar / count */}
                    <div className="relative flex-shrink-0">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                        {participants.length > 1
                          ? participants.length
                          : (participants[0]?.name?.[0] ?? '?')}
                      </div>
                      {participants.length > 1 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center">
                          <Users className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">{label}</div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                        <span>{new Date(session.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                        <span>·</span>
                        <span>{session.startTime}–{session.endTime}</span>
                        {session.location && <><span>·</span><span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{session.location}</span></>}
                      </div>
                      {/* Participants preview */}
                      {participants.length > 0 && (
                        <div className="text-xs text-slate-500 mt-1 truncate">
                          {participants.map(p => p.name).join(', ')}
                        </div>
                      )}
                    </div>

                    {/* Right side */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {session.price && <span className="text-sm font-semibold text-white hidden sm:block">{session.price} €</span>}
                      <span className={`hidden sm:block text-xs px-2 py-0.5 rounded-full border ${tcfg.color}`}>{tcfg.label}</span>
                      <ChevronDown className="w-4 h-4 text-slate-600 rotate-[-90deg]" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Session detail modal */}
      {selectedSession && (
        <SessionDetail
          session={selectedSession}
          clients={clients}
          role={role}
          onClose={() => setSelectedSession(null)}
          onStatusChange={updateSessionStatus}
        />
      )}

      {/* Create session modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-white">Planifier une séance</h2>
              <button onClick={() => setShowModal(false)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* Type */}
              <div>
                <label className="block text-xs text-slate-400 mb-2">Type de séance</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['individual', 'group', 'online'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                        form.type === t ? typeConfig[t].color : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {typeConfig[t].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title for group */}
              {form.type === 'group' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Nom du cours</label>
                  <input
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="Ex : Yoga du matin, HIIT…"
                  />
                </div>
              )}

              {/* Client (individual) */}
              {form.type === 'individual' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Client *</label>
                  <select
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    value={form.clientId}
                    onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))}
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {/* Participants (group / online) */}
              {form.type !== 'individual' && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-slate-400">Participants</label>
                    <span className="text-xs text-slate-500">{form.participantIds.length} sélectionné{form.participantIds.length > 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {clients.map(c => (
                      <button
                        key={c.id}
                        onClick={() => toggleParticipant(c.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg border text-left transition-colors ${
                          form.participantIds.includes(c.id)
                            ? 'bg-blue-500/20 border-blue-500/40 text-white'
                            : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                        }`}
                      >
                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                          {c.name[0]}
                        </div>
                        <span className="text-sm flex-1">{c.name}</span>
                        {form.participantIds.includes(c.id) && (
                          <CheckCircle2 className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="mt-2">
                    <label className="block text-xs text-slate-400 mb-1.5">Places max</label>
                    <input
                      type="number" min={1} max={100}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                      value={form.maxParticipants}
                      onChange={e => setForm(f => ({ ...f, maxParticipants: +e.target.value }))}
                    />
                  </div>
                </div>
              )}

              {/* Date / Time */}
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Date *</label>
                <input
                  type="date"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  value={form.date}
                  onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Début</label>
                  <input type="time" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Fin</label>
                  <input type="time" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Lieu</label>
                  <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Salle, en ligne…" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Prix (€)</label>
                  <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
                <textarea
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                  rows={2} value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Objectifs, consignes…"
                />
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-slate-800">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors border border-slate-700">
                Annuler
              </button>
              <button
                onClick={handleAdd}
                disabled={
                  !form.date ||
                  (form.type === 'individual' && !form.clientId) ||
                  (form.type !== 'individual' && form.participantIds.length === 0 && !form.title)
                }
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                <Plus className="w-4 h-4" /> Planifier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
