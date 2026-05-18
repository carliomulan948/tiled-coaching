'use client';

import { Bell, Search, Menu } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onMenuToggle?: () => void;
}

export default function Header({ title, subtitle, onMenuToggle }: HeaderProps) {
  const [showNotif, setShowNotif] = useState(false);

  return (
    <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-white">{title}</h1>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="hidden md:flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 w-64">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="bg-transparent text-sm text-slate-300 placeholder-slate-500 outline-none w-full"
          />
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotif(!showNotif)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full" />
          </button>

          {showNotif && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="p-4 border-b border-slate-700">
                <h3 className="font-semibold text-white">Notifications</h3>
              </div>
              <div className="divide-y divide-slate-700">
                {[
                  { title: 'Facture en retard', desc: 'Pierre Moreau — FAC-2026-003', time: 'il y a 2h', dot: 'bg-red-400' },
                  { title: 'Nouvelle session', desc: 'Emma Rousseau — 19 mai à 09h00', time: 'il y a 4h', dot: 'bg-blue-400' },
                  { title: 'Paiement reçu', desc: 'Lucas Petit — 260 €', time: 'hier', dot: 'bg-green-400' },
                ].map((notif, i) => (
                  <div key={i} className="p-4 hover:bg-slate-700/50 cursor-pointer transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${notif.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white">{notif.title}</div>
                        <div className="text-xs text-slate-400 truncate">{notif.desc}</div>
                        <div className="text-xs text-slate-600 mt-1">{notif.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 text-center">
                <button className="text-sm text-blue-400 hover:text-blue-300">Voir toutes les notifications</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
