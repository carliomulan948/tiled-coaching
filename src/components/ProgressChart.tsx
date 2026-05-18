'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from 'recharts';
import { ProgressMeasurement } from '@/lib/types';

interface ProgressChartProps {
  data: ProgressMeasurement[];
  metric: 'measurements' | 'weight' | 'bodyFat';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-xl">
        <p className="text-slate-400 text-xs mb-2">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
            <span className="text-slate-300">{entry.name}:</span>
            <span className="text-white font-semibold">{entry.value} {entry.unit || ''}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ProgressChart({ data, metric }: ProgressChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <p>Aucune donnée disponible</p>
      </div>
    );
  }

  if (metric === 'weight') {
    const chartData = data.map(d => ({
      date: formatDate(d.date),
      Poids: d.weight,
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#1e2433' }} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#1e2433' }} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="Poids"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ fill: '#3b82f6', r: 4, strokeWidth: 2, stroke: '#1e2433' }}
            activeDot={{ r: 6, fill: '#60a5fa' }}
            unit=" kg"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (metric === 'bodyFat') {
    const chartData = data.map(d => ({
      date: formatDate(d.date),
      'Masse grasse': d.bodyFat,
    }));

    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#1e2433' }} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#1e2433' }} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="Masse grasse"
            stroke="#8b5cf6"
            strokeWidth={2.5}
            dot={{ fill: '#8b5cf6', r: 4, strokeWidth: 2, stroke: '#1e2433' }}
            activeDot={{ r: 6, fill: '#a78bfa' }}
            unit=" %"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  // Measurements bar chart
  const chartData = data.map(d => ({
    date: formatDate(d.date),
    Poitrine: d.chest,
    Taille: d.waist,
    Biceps: d.biceps,
    Cuisses: d.thighs,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }} barSize={10}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#1e2433' }} tickLine={false} />
        <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: '#1e2433' }} tickLine={false} domain={[0, 120]} />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: '16px', fontSize: '12px', color: '#94a3b8' }}
          iconType="circle"
          iconSize={8}
        />
        <Bar dataKey="Poitrine" fill="#3b82f6" radius={[4, 4, 0, 0]} unit=" cm" />
        <Bar dataKey="Taille" fill="#8b5cf6" radius={[4, 4, 0, 0]} unit=" cm" />
        <Bar dataKey="Biceps" fill="#06b6d4" radius={[4, 4, 0, 0]} unit=" cm" />
        <Bar dataKey="Cuisses" fill="#10b981" radius={[4, 4, 0, 0]} unit=" cm" />
      </BarChart>
    </ResponsiveContainer>
  );
}
