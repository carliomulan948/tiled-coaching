'use client';

import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  color?: 'blue' | 'purple' | 'green' | 'orange' | 'cyan' | 'red';
}

const colorMap = {
  blue: {
    icon: 'bg-blue-500/20 text-blue-400',
    gradient: 'from-blue-500/10',
    border: 'border-blue-500/20',
    trend: 'text-blue-400',
  },
  purple: {
    icon: 'bg-purple-500/20 text-purple-400',
    gradient: 'from-purple-500/10',
    border: 'border-purple-500/20',
    trend: 'text-purple-400',
  },
  green: {
    icon: 'bg-green-500/20 text-green-400',
    gradient: 'from-green-500/10',
    border: 'border-green-500/20',
    trend: 'text-green-400',
  },
  orange: {
    icon: 'bg-orange-500/20 text-orange-400',
    gradient: 'from-orange-500/10',
    border: 'border-orange-500/20',
    trend: 'text-orange-400',
  },
  cyan: {
    icon: 'bg-cyan-500/20 text-cyan-400',
    gradient: 'from-cyan-500/10',
    border: 'border-cyan-500/20',
    trend: 'text-cyan-400',
  },
  red: {
    icon: 'bg-red-500/20 text-red-400',
    gradient: 'from-red-500/10',
    border: 'border-red-500/20',
    trend: 'text-red-400',
  },
};

export default function StatCard({ title, value, subtitle, icon: Icon, trend, color = 'blue' }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div className={`relative overflow-hidden bg-slate-800/50 border ${colors.border} rounded-xl p-5 bg-gradient-to-br ${colors.gradient} to-transparent`}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-lg ${colors.icon} flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
            {trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm font-medium text-slate-400">{title}</div>
      {subtitle && <div className="text-xs text-slate-600 mt-1">{subtitle}</div>}

      {/* Decorative element */}
      <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full ${colors.icon} opacity-10`} />
    </div>
  );
}
