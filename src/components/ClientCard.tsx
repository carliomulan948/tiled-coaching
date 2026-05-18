'use client';

import Link from 'next/link';
import { Phone, Mail, Target, Calendar, ChevronRight } from 'lucide-react';
import { Client } from '@/lib/types';

interface ClientCardProps {
  client: Client;
  coachName?: string;
}

const statusConfig = {
  active: { label: 'Actif', class: 'bg-green-500/20 text-green-400 border-green-500/30' },
  inactive: { label: 'Inactif', class: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
  pending: { label: 'En attente', class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
};

const goalAbbrev = (goal: string) => {
  if (goal.length > 35) return goal.slice(0, 32) + '...';
  return goal;
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const avatarColors = [
  'from-blue-500 to-blue-700',
  'from-purple-500 to-purple-700',
  'from-cyan-500 to-cyan-700',
  'from-green-500 to-green-700',
  'from-orange-500 to-orange-700',
  'from-pink-500 to-pink-700',
];

function getAvatarColor(id: string) {
  const index = id.charCodeAt(id.length - 1) % avatarColors.length;
  return avatarColors[index];
}

export default function ClientCard({ client, coachName }: ClientCardProps) {
  const status = statusConfig[client.status];

  return (
    <Link href={`/clients/${client.id}`}>
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 hover:border-blue-500/40 hover:bg-slate-800 transition-all duration-200 cursor-pointer group">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getAvatarColor(client.id)} flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg`}>
              {getInitials(client.name)}
            </div>
            <div>
              <div className="font-semibold text-white group-hover:text-blue-400 transition-colors">{client.name}</div>
              {coachName && <div className="text-xs text-slate-500">Coach: {coachName}</div>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${status.class}`}>
              {status.label}
            </span>
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors" />
          </div>
        </div>

        <div className="space-y-2">
          {client.goal && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Target className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
              <span className="truncate">{goalAbbrev(client.goal)}</span>
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Mail className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
              <span className="truncate">{client.email}</span>
            </div>
          )}
          {client.phone && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Phone className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
              <span>{client.phone}</span>
            </div>
          )}
          {client.startDate && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
              <span>Depuis le {new Date(client.startDate).toLocaleDateString('fr-FR')}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
