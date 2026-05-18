'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dumbbell, User, Shield, ChevronRight, Star, Users, TrendingUp } from 'lucide-react';
import { setAuth, initializeStorage, getAuth } from '@/lib/storage';
import { UserRole } from '@/lib/types';
import { mockCoaches, mockClients } from '@/lib/mockData';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<UserRole | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    initializeStorage();
    const auth = getAuth();
    if (auth.isAuthenticated) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleLogin = (role: UserRole) => {
    setLoading(role);
    let user;
    if (role === 'admin') {
      user = {
        id: 'admin-1',
        name: 'Admin Principal',
        email: 'admin@coachpro.fr',
        role: 'admin' as UserRole,
        createdAt: '2023-01-01',
      };
    } else if (role === 'coach') {
      user = mockCoaches[0];
    } else {
      user = mockClients[0];
    }

    setAuth({ user, role, isAuthenticated: true });

    setTimeout(() => {
      router.push('/dashboard');
    }, 600);
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-slate-950 flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-slate-900 via-blue-950 to-purple-950 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500 rounded-full opacity-10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500 rounded-full opacity-10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500 rounded-full opacity-5 blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">CoachPro</span>
          </div>

          <h1 className="text-4xl font-bold text-white mb-6 leading-tight">
            La plateforme de gestion pour coachs professionnels
          </h1>
          <p className="text-slate-400 text-lg mb-12">
            Gérez vos clients, suivez leurs progrès, créez vos factures et optimisez votre activité depuis une seule interface.
          </p>

          <div className="space-y-6">
            {[
              { icon: Users, label: 'Gestion complète des clients', desc: 'Profils, suivi, historique' },
              { icon: TrendingUp, label: 'Suivi des progrès', desc: 'Mesures, graphiques, évolution' },
              { icon: Star, label: 'Facturation électronique', desc: 'Devis, factures, paiements' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                  <item.icon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <div className="text-white font-medium">{item.label}</div>
                  <div className="text-slate-400 text-sm">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {['MD', 'TM', 'SB'].map((initials, i) => (
                <div key={i} className={`w-9 h-9 rounded-full border-2 border-slate-800 flex items-center justify-center text-xs font-bold text-white ${['bg-blue-500', 'bg-purple-500', 'bg-cyan-500'][i]}`}>
                  {initials}
                </div>
              ))}
            </div>
            <div>
              <div className="text-white text-sm font-medium">3 coachs actifs</div>
              <div className="text-slate-400 text-xs">+8 clients suivis</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">CoachPro</span>
          </div>

          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">Connexion</h2>
            <p className="text-slate-400">Choisissez votre rôle pour accéder à l'application</p>
          </div>

          <div className="space-y-4">
            {/* Admin button */}
            <button
              onClick={() => handleLogin('admin')}
              disabled={loading !== null}
              className="w-full group relative overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50 p-5 text-left transition-all duration-200 hover:border-purple-500/50 hover:bg-slate-800 disabled:opacity-70"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-500/30 transition-colors">
                  <Shield className="w-6 h-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white text-lg">Administrateur</div>
                  <div className="text-slate-400 text-sm">Gestion complète de la plateforme</div>
                </div>
                {loading === 'admin' ? (
                  <div className="w-5 h-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
                )}
              </div>
            </button>

            {/* Coach button */}
            <button
              onClick={() => handleLogin('coach')}
              disabled={loading !== null}
              className="w-full group relative overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50 p-5 text-left transition-all duration-200 hover:border-blue-500/50 hover:bg-slate-800 disabled:opacity-70"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/30 transition-colors">
                  <Dumbbell className="w-6 h-6 text-blue-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white text-lg">Coach</div>
                  <div className="text-slate-400 text-sm">Marie Dupont — Fitness & Musculation</div>
                </div>
                {loading === 'coach' ? (
                  <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
                )}
              </div>
            </button>

            {/* Client button */}
            <button
              onClick={() => handleLogin('client')}
              disabled={loading !== null}
              className="w-full group relative overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50 p-5 text-left transition-all duration-200 hover:border-cyan-500/50 hover:bg-slate-800 disabled:opacity-70"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/30 transition-colors">
                  <User className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white text-lg">Client</div>
                  <div className="text-slate-400 text-sm">Lucas Petit — Programme musculation</div>
                </div>
                {loading === 'client' ? (
                  <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                )}
              </div>
            </button>
          </div>

          <div className="mt-8 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50">
            <p className="text-slate-500 text-xs text-center">
              Mode démonstration — Toutes les données sont stockées localement dans votre navigateur
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
