'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Dumbbell, LayoutDashboard, Users, FileText, Calendar,
  CreditCard, TrendingUp, Settings, LogOut, ChevronRight, Shield
} from 'lucide-react';
import { getAuth, clearAuth } from '@/lib/storage';
import { useEffect, useState } from 'react';
import { AuthState } from '@/lib/types';

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/invoices', icon: FileText, label: 'Factures' },
  { href: '/schedule', icon: Calendar, label: 'Planning' },
  { href: '/payments', icon: CreditCard, label: 'Paiements' },
  { href: '/progress', icon: TrendingUp, label: 'Progression' },
  { href: '/admin', icon: Shield, label: 'Administration', adminOnly: true },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>({ user: null, role: null, isAuthenticated: false });

  useEffect(() => {
    setAuth(getAuth());
  }, []);

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  const visibleItems = navItems.filter(item => {
    if (item.adminOnly && auth.role !== 'admin') return false;
    return true;
  });

  const getRoleLabel = (role: string | null) => {
    if (role === 'admin') return 'Administrateur';
    if (role === 'coach') return 'Coach';
    if (role === 'client') return 'Client';
    return '';
  };

  const getRoleColor = (role: string | null) => {
    if (role === 'admin') return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    if (role === 'coach') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (role === 'client') return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
    return '';
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getAvatarColor = (role: string | null) => {
    if (role === 'admin') return 'from-purple-500 to-purple-700';
    if (role === 'coach') return 'from-blue-500 to-blue-700';
    return 'from-cyan-500 to-cyan-700';
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-full z-40 w-64
        bg-slate-900 border-r border-slate-800
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Dumbbell className="w-4 h-4 text-white" />
            </div>
            <span className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
              CoachPro
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {visibleItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200 group
                    ${isActive
                      ? 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }
                  `}
                >
                  <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="flex-1">{item.label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 text-blue-400" />}
                </Link>
              );
            })}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="px-3 mb-3">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Support</span>
            </div>
            <Link
              href="/admin"
              onClick={onClose}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all duration-200 group"
            >
              <Settings className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
              <span>Paramètres</span>
            </Link>
          </div>
        </nav>

        {/* User info */}
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${getAvatarColor(auth.role)} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
              {auth.user?.name ? getInitials(auth.user.name) : '?'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white truncate">{auth.user?.name || 'Utilisateur'}</div>
              <div className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium border ${getRoleColor(auth.role)}`}>
                {getRoleLabel(auth.role)}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>
    </>
  );
}
