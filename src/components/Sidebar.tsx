'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Dumbbell, LayoutDashboard, Users, FileText, Calendar,
  CreditCard, TrendingUp, Settings, LogOut, ChevronRight, Shield, ShoppingBag, MessageSquare, ClipboardList,
  Compass, NotebookPen, Menu, X,
} from 'lucide-react';
import { getUnreadCount } from '@/lib/storage';
import { getAuth, clearAuth } from '@/lib/storage';
import { useEffect, useState } from 'react';
import { AuthState } from '@/lib/types';
import { BRAND } from '@/lib/brand';
import { questRoutes } from '@/lib/quest/routes';
import SquattyLogo from '@/components/SquattyLogo';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: boolean;
  adminOnly?: boolean;
}

const proItems: NavItem[] = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { href: '/clients', icon: Users, label: 'Clients' },
  { href: '/invoices', icon: FileText, label: 'Factures' },
  { href: '/schedule', icon: Calendar, label: 'Planning' },
  { href: '/payments', icon: CreditCard, label: 'Paiements' },
  { href: '/progress', icon: TrendingUp, label: 'Progression' },
  { href: '/messages', icon: MessageSquare, label: 'Messages', badge: true },
  { href: '/exercices', icon: Dumbbell, label: 'Exercices' },
  { href: '/programmes', icon: ClipboardList, label: 'Programmes' },
  { href: '/boutique', icon: ShoppingBag, label: 'Boutique' },
  { href: '/admin', icon: Shield, label: 'Administration', adminOnly: true },
];

const questItems: NavItem[] = [
  { href: questRoutes.home, icon: Compass, label: 'Aventure' },
  { href: questRoutes.carnet, icon: NotebookPen, label: 'Carnet' },
];

function isItemActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === questRoutes.home) {
    return pathname.startsWith(`${questRoutes.home}/`) && !pathname.startsWith(questRoutes.carnet);
  }
  return pathname.startsWith(`${href}/`);
}

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [auth, setAuth] = useState<AuthState>({ user: null, role: null, isAuthenticated: false });
  const [unread, setUnread] = useState(0);
  // Sans contrôle externe, le menu gère lui-même son tiroir mobile et sa barre supérieure.
  const controlled = mobileOpen !== undefined;
  const [ownOpen, setOwnOpen] = useState(false);
  const open = controlled ? mobileOpen : ownOpen;
  const close = () => {
    if (controlled) onClose?.();
    else setOwnOpen(false);
  };

  useEffect(() => {
    const a = getAuth();
    setAuth(a);
    if (a.user) setUnread(getUnreadCount(a.user.id));
    const interval = setInterval(() => {
      const fresh = getAuth();
      if (fresh.user) setUnread(getUnreadCount(fresh.user.id));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setOwnOpen(false);
  }, [pathname]);

  // Échap ferme le tiroir mobile
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (controlled) onClose?.();
      else setOwnOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, controlled, onClose]);

  useEffect(() => {
    if (controlled) return;
    document.body.classList.add('has-mobile-bar');
    return () => document.body.classList.remove('has-mobile-bar');
  }, [controlled]);

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  const visibleProItems = proItems.filter(item => !(item.adminOnly && auth.role !== 'admin'));

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

  const renderItem = (item: NavItem, quest = false) => {
    const isActive = isItemActive(pathname, item.href);
    const activeClass = quest
      ? 'bg-gradient-to-r from-orange-500/20 to-pink-500/20 text-orange-300 border border-orange-500/20'
      : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/20';
    const activeIcon = quest ? 'text-orange-300' : 'text-blue-400';
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={close}
        aria-current={isActive ? 'page' : undefined}
        className={`
          flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
          transition-all duration-200 group
          ${isActive ? activeClass : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}
        `}
      >
        <item.icon className={`w-4 h-4 flex-shrink-0 ${isActive ? activeIcon : 'text-slate-500 group-hover:text-slate-300'}`} />
        <span className="flex-1">{item.label}</span>
        {item.badge && unread > 0 && (
          <span className="w-5 h-5 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        {isActive && !(item.badge && unread > 0) && <ChevronRight className={`w-3 h-3 ${activeIcon}`} />}
      </Link>
    );
  };

  return (
    <>
      {/* Barre supérieure mobile */}
      {!controlled && (
        <div className="lg:hidden fixed top-0 inset-x-0 h-14 z-30 bg-slate-900/95 backdrop-blur border-b border-slate-800 flex items-center justify-between px-3">
          <button
            type="button"
            onClick={() => setOwnOpen(true)}
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
          <Link href="/dashboard" aria-label="Tableau de bord">
            <SquattyLogo size={28} />
          </Link>
          <Link
            href={questRoutes.home}
            aria-label={BRAND.questSpace}
            className="p-2 rounded-lg text-orange-300 hover:text-orange-200 hover:bg-slate-800"
          >
            <Compass className="w-5 h-5" />
          </Link>
        </div>
      )}

      {/* Fond assombri sur mobile */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={close}
        />
      )}

      {/* Menu latéral */}
      <aside className={`
        fixed left-0 top-0 h-full z-40 w-64
        bg-slate-900 border-r border-slate-800
        flex flex-col
        transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <Link href="/dashboard" onClick={close} className="group">
            <SquattyLogo subtitle={BRAND.tagline} />
          </Link>
          <button
            type="button"
            onClick={close}
            aria-label="Fermer le menu"
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto" aria-label="Navigation principale">
          {/* Quest en premier : deux entrées seulement, visibles sans défiler sur téléphone */}
          <div className="px-3 mb-2">
            <span className="text-xs font-semibold text-orange-300/80 uppercase tracking-wider">{BRAND.questSpace}</span>
          </div>
          <div className="space-y-1">
            {questItems.map(item => renderItem(item, true))}
          </div>

          <div className="px-3 mt-5 mb-2">
            <span className="text-xs font-semibold text-blue-300/70 uppercase tracking-wider">{BRAND.proSpace}</span>
          </div>
          <div className="space-y-1">
            {visibleProItems.map(item => renderItem(item))}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-800">
            <div className="px-3 mb-3">
              <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Support</span>
            </div>
            <Link
              href="/admin"
              onClick={close}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-all duration-200 group"
            >
              <Settings className="w-4 h-4 text-slate-500 group-hover:text-slate-300" />
              <span>Paramètres</span>
            </Link>
          </div>
        </nav>

        {/* Profil actif */}
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
