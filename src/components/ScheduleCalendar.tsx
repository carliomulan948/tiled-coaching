'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Clock, User, MapPin } from 'lucide-react';
import { Session, Client } from '@/lib/types';

interface ScheduleCalendarProps {
  sessions: Session[];
  clients: Client[];
  onAddSession?: (date: string, time: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

const HOURS = Array.from({ length: 13 }, (_, i) => i + 7); // 7h to 19h
const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

const typeColors: Record<string, string> = {
  individual: 'bg-blue-500/80 border-blue-400',
  group: 'bg-purple-500/80 border-purple-400',
  online: 'bg-cyan-500/80 border-cyan-400',
};

const statusOpacity: Record<string, string> = {
  scheduled: 'opacity-100',
  completed: 'opacity-60',
  cancelled: 'opacity-30',
  no_show: 'opacity-30',
};

function getWeekDates(date: Date): Date[] {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function dateToStr(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function ScheduleCalendar({ sessions, clients, onAddSession, onDeleteSession }: ScheduleCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  const weekDates = getWeekDates(new Date(currentDate));

  const prevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const nextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  const getSessionsForSlot = (date: Date, hour: number): Session[] => {
    const dateStr = dateToStr(date);
    return sessions.filter(s => {
      if (s.date !== dateStr) return false;
      const sessionHour = parseInt(s.startTime.split(':')[0]);
      return sessionHour === hour;
    });
  };

  const getClientName = (clientId: string): string => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'Client inconnu';
  };

  const today = dateToStr(new Date());

  const weekLabel = `${weekDates[0].getDate()} ${MONTHS_FR[weekDates[0].getMonth()]} — ${weekDates[6].getDate()} ${MONTHS_FR[weekDates[6].getMonth()]} ${weekDates[6].getFullYear()}`;

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <button
            onClick={prevWeek}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-white">{weekLabel}</span>
          <button
            onClick={nextWeek}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 text-xs font-medium text-blue-400 hover:text-white bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20"
          >
            Aujourd'hui
          </button>
          <div className="flex items-center gap-3 ml-2">
            {Object.entries({ individual: 'Individuel', group: 'Groupe', online: 'En ligne' }).map(([type, label]) => (
              <div key={type} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${type === 'individual' ? 'bg-blue-400' : type === 'group' ? 'bg-purple-400' : 'bg-cyan-400'}`} />
                <span className="text-xs text-slate-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Day headers */}
          <div className="grid grid-cols-8 border-b border-slate-700">
            <div className="py-3 px-2" /> {/* Time column */}
            {weekDates.map((date, i) => {
              const dateStr = dateToStr(date);
              const isToday = dateStr === today;
              return (
                <div key={i} className="py-3 text-center">
                  <div className="text-xs text-slate-500 mb-1">{DAYS_FR[i]}</div>
                  <div className={`
                    w-8 h-8 mx-auto rounded-full flex items-center justify-center text-sm font-semibold
                    ${isToday ? 'bg-blue-500 text-white' : 'text-slate-300'}
                  `}>
                    {date.getDate()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Time slots */}
          <div className="max-h-[500px] overflow-y-auto">
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-8 border-b border-slate-800 min-h-[60px]">
                <div className="py-2 px-3 text-xs text-slate-600 text-right flex-shrink-0">
                  {hour}:00
                </div>
                {weekDates.map((date, i) => {
                  const slotSessions = getSessionsForSlot(date, hour);
                  const dateStr = dateToStr(date);
                  return (
                    <div
                      key={i}
                      className="border-l border-slate-800 p-1 cursor-pointer hover:bg-slate-700/20 transition-colors group"
                      onClick={() => onAddSession && slotSessions.length === 0 && onAddSession(dateStr, `${String(hour).padStart(2, '0')}:00`)}
                    >
                      {slotSessions.map(session => (
                        <div
                          key={session.id}
                          onClick={(e) => { e.stopPropagation(); setSelectedSession(session); }}
                          className={`
                            ${typeColors[session.type]} ${statusOpacity[session.status]}
                            rounded-md p-1.5 border text-xs cursor-pointer
                            hover:brightness-110 transition-all mb-1
                          `}
                        >
                          <div className="font-medium text-white truncate">{getClientName(session.clientId)}</div>
                          <div className="text-white/80">{session.startTime}–{session.endTime}</div>
                        </div>
                      ))}
                      {slotSessions.length === 0 && (
                        <div className="hidden group-hover:flex items-center justify-center h-full opacity-50">
                          <Plus className="w-3 h-3 text-slate-400" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Session detail modal */}
      {selectedSession && (
        <div className="modal-overlay" onClick={() => setSelectedSession(null)}>
          <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Détail de la séance</h3>
                <button onClick={() => setSelectedSession(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="text-white">{getClientName(selectedSession.clientId)}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">
                    {new Date(selectedSession.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    {' · '}{selectedSession.startTime}–{selectedSession.endTime}
                  </span>
                </div>
                {selectedSession.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="text-slate-300">{selectedSession.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                    selectedSession.status === 'scheduled' ? 'badge-sent' :
                    selectedSession.status === 'completed' ? 'badge-paid' :
                    'badge-draft'
                  }`}>
                    {selectedSession.status === 'scheduled' ? 'Planifiée' :
                     selectedSession.status === 'completed' ? 'Terminée' :
                     selectedSession.status === 'cancelled' ? 'Annulée' : 'Absent'}
                  </span>
                  {selectedSession.price && (
                    <span className="text-slate-400 text-sm">{selectedSession.price} €</span>
                  )}
                </div>
                {selectedSession.notes && (
                  <p className="text-sm text-slate-400 bg-slate-900/50 rounded-lg p-3">{selectedSession.notes}</p>
                )}
              </div>
              {onDeleteSession && (
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => { onDeleteSession(selectedSession.id); setSelectedSession(null); }}
                    className="px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20"
                  >
                    Supprimer
                  </button>
                  <button
                    onClick={() => setSelectedSession(null)}
                    className="btn-secondary text-sm"
                  >
                    Fermer
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
