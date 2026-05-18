'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import { getAuth, getClients, getClientProgress, getProgressData, saveProgressData } from '@/lib/storage';
import { Client, ProgressMeasurement } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { Plus, TrendingDown, TrendingUp, Minus, X } from 'lucide-react';

const METRICS = [
  { key: 'weight', label: 'Poids (kg)', color: '#3b82f6' },
  { key: 'bodyFat', label: 'Masse grasse (%)', color: '#8b5cf6' },
  { key: 'chest', label: 'Poitrine (cm)', color: '#06b6d4' },
  { key: 'waist', label: 'Tour de taille (cm)', color: '#f59e0b' },
  { key: 'hips', label: 'Hanches (cm)', color: '#ec4899' },
  { key: 'biceps', label: 'Biceps (cm)', color: '#10b981' },
  { key: 'thighs', label: 'Cuisses (cm)', color: '#f97316' },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string; color: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1e2433] border border-[#2d3748] rounded-xl p-3 shadow-xl">
      <p className="text-xs text-slate-400 mb-2">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-sm font-medium" style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function ProgressPage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [progressData, setProgressData] = useState<ProgressMeasurement[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState(['weight', 'bodyFat']);
  const [showModal, setShowModal] = useState(false);
  const [role, setRole] = useState('coach');
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '', bodyFat: '', chest: '', waist: '', hips: '', biceps: '', thighs: '', notes: '',
  });

  useEffect(() => {
    const auth = getAuth();
    if (!auth.isAuthenticated) { router.push('/'); return; }
    setRole(auth.role || 'coach');
    const allClients = getClients();
    if (auth.role === 'coach') {
      const coachClients = allClients.filter(c => c.coachId === auth.user?.id);
      setClients(coachClients);
      if (coachClients.length > 0) {
        setSelectedClientId(coachClients[0].id);
        setProgressData(getClientProgress(coachClients[0].id));
      }
    } else if (auth.role === 'client') {
      const c = allClients.find(c => c.id === auth.user?.id);
      if (c) { setClients([c]); setSelectedClientId(c.id); setProgressData(getClientProgress(c.id)); }
    } else {
      setClients(allClients);
      if (allClients.length > 0) {
        setSelectedClientId(allClients[0].id);
        setProgressData(getClientProgress(allClients[0].id));
      }
    }
  }, [router]);

  const handleClientChange = (cid: string) => {
    setSelectedClientId(cid);
    setProgressData(getClientProgress(cid));
  };

  const toggleMetric = (key: string) => {
    setSelectedMetrics(prev =>
      prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
    );
  };

  const chartData = progressData.map(p => ({
    date: new Date(p.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' }),
    ...Object.fromEntries(METRICS.map(m => [m.label, p[m.key as keyof ProgressMeasurement] || null])),
  }));

  const handleAddMeasurement = () => {
    const newEntry: ProgressMeasurement = {
      id: `prog-${Date.now()}`,
      clientId: selectedClientId,
      date: form.date,
      ...(form.weight && { weight: parseFloat(form.weight) }),
      ...(form.bodyFat && { bodyFat: parseFloat(form.bodyFat) }),
      ...(form.chest && { chest: parseFloat(form.chest) }),
      ...(form.waist && { waist: parseFloat(form.waist) }),
      ...(form.hips && { hips: parseFloat(form.hips) }),
      ...(form.biceps && { biceps: parseFloat(form.biceps) }),
      ...(form.thighs && { thighs: parseFloat(form.thighs) }),
      ...(form.notes && { notes: form.notes }),
    };
    const all = getProgressData();
    all.push(newEntry);
    saveProgressData(all);
    setProgressData(getClientProgress(selectedClientId));
    setShowModal(false);
    setForm({ date: new Date().toISOString().split('T')[0], weight: '', bodyFat: '', chest: '', waist: '', hips: '', biceps: '', thighs: '', notes: '' });
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);
  const latest = progressData[progressData.length - 1];
  const prev = progressData[progressData.length - 2];

  const getDelta = (key: keyof ProgressMeasurement) => {
    if (!latest || !prev) return null;
    const l = latest[key] as number;
    const p = prev[key] as number;
    if (!l || !p) return null;
    return +(l - p).toFixed(1);
  };

  const Trend = ({ delta, inverse = false }: { delta: number | null; inverse?: boolean }) => {
    if (delta === null) return <Minus className="w-4 h-4 text-slate-500" />;
    const positive = inverse ? delta < 0 : delta > 0;
    return delta === 0 ? <Minus className="w-4 h-4 text-slate-400" /> :
      positive ? <TrendingUp className="w-4 h-4 text-green-400" /> : <TrendingDown className="w-4 h-4 text-red-400" />;
  };

  return (
    <div className="flex min-h-screen bg-[#080d1a]">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">Progression musculaire</h1>
            <p className="text-slate-400 text-sm">{progressData.length} mesure{progressData.length > 1 ? 's' : ''} enregistrée{progressData.length > 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Ajouter une mesure
          </button>
        </div>

        {/* Client selector */}
        {clients.length > 1 && (
          <div className="mb-6">
            <label className="block text-xs text-slate-400 mb-2">Client sélectionné</label>
            <select className="input-dark max-w-xs" value={selectedClientId} onChange={e => handleClientChange(e.target.value)}>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        )}

        {/* Latest metrics */}
        {latest && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
            {METRICS.map(m => {
              const val = latest[m.key as keyof ProgressMeasurement] as number;
              const delta = getDelta(m.key as keyof ProgressMeasurement);
              return val ? (
                <div key={m.key} className="card-dark p-3 text-center">
                  <div className="text-xs text-slate-500 mb-1 truncate">{m.key === 'bodyFat' ? 'M. grasse' : m.key === 'weight' ? 'Poids' : m.label.split(' ')[0]}</div>
                  <div className="text-lg font-bold text-white">{val}</div>
                  <div className="text-xs text-slate-500">{m.key === 'weight' ? 'kg' : m.key === 'bodyFat' ? '%' : 'cm'}</div>
                  <div className="flex items-center justify-center mt-1">
                    <Trend delta={delta} inverse={['waist', 'bodyFat', 'hips', 'thighs', 'weight'].includes(m.key) && m.key !== 'biceps' && m.key !== 'chest'} />
                    {delta !== null && delta !== 0 && (
                      <span className={`text-xs ml-1 ${delta > 0 ? 'text-green-400' : 'text-red-400'}`}>{delta > 0 ? '+' : ''}{delta}</span>
                    )}
                  </div>
                </div>
              ) : null;
            })}
          </div>
        )}

        {/* Metric selector */}
        <div className="flex flex-wrap gap-2 mb-4">
          {METRICS.map(m => (
            <button key={m.key} onClick={() => toggleMetric(m.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                selectedMetrics.includes(m.key)
                  ? `border-[${m.color}] text-white`
                  : 'bg-[#1e2433] text-slate-500 border-[#2d3748] hover:border-slate-500'
              }`}
              style={selectedMetrics.includes(m.key) ? { backgroundColor: `${m.color}20`, borderColor: `${m.color}50`, color: m.color } : {}}>
              {m.label}
            </button>
          ))}
        </div>

        {/* Bar Chart */}
        <div className="card-dark mb-6">
          <h2 className="font-semibold text-white mb-6">Évolution des mesures</h2>
          {chartData.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>Aucune donnée de progression disponible</p>
              <p className="text-xs mt-1">Ajoutez une mesure pour commencer le suivi</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2433" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '16px', fontSize: '12px' }} />
                {METRICS.filter(m => selectedMetrics.includes(m.key)).map(m => (
                  <Bar key={m.key} dataKey={m.label} fill={m.color} radius={[4, 4, 0, 0]} maxBarSize={40} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* History table */}
        <div className="card-dark p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-[#2d3748]">
            <h2 className="font-semibold text-white">Historique des mesures</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-dark">
              <thead>
                <tr>
                  <th className="text-left">Date</th>
                  <th className="text-right">Poids</th>
                  <th className="text-right">M. grasse</th>
                  <th className="text-right">Poitrine</th>
                  <th className="text-right">Taille</th>
                  <th className="text-right">Hanches</th>
                  <th className="text-right">Biceps</th>
                  <th className="text-right">Cuisses</th>
                </tr>
              </thead>
              <tbody>
                {[...progressData].reverse().map(entry => (
                  <tr key={entry.id}>
                    <td className="text-white font-medium">{new Date(entry.date).toLocaleDateString('fr-FR')}</td>
                    <td className="text-right text-slate-300">{entry.weight ? `${entry.weight} kg` : '—'}</td>
                    <td className="text-right text-slate-300">{entry.bodyFat ? `${entry.bodyFat} %` : '—'}</td>
                    <td className="text-right text-slate-300">{entry.chest ? `${entry.chest} cm` : '—'}</td>
                    <td className="text-right text-slate-300">{entry.waist ? `${entry.waist} cm` : '—'}</td>
                    <td className="text-right text-slate-300">{entry.hips ? `${entry.hips} cm` : '—'}</td>
                    <td className="text-right text-slate-300">{entry.biceps ? `${entry.biceps} cm` : '—'}</td>
                    <td className="text-right text-slate-300">{entry.thighs ? `${entry.thighs} cm` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-[#2d3748]">
              <h2 className="text-lg font-semibold text-white">Nouvelle mesure — {selectedClient?.name}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Date *</label>
                <input className="input-dark" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: 'weight', label: 'Poids (kg)' },
                  { key: 'bodyFat', label: 'Masse grasse (%)' },
                  { key: 'chest', label: 'Poitrine (cm)' },
                  { key: 'waist', label: 'Tour de taille (cm)' },
                  { key: 'hips', label: 'Hanches (cm)' },
                  { key: 'biceps', label: 'Biceps (cm)' },
                  { key: 'thighs', label: 'Cuisses (cm)' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
                    <input className="input-dark" type="number" step="0.1"
                      value={form[key as keyof typeof form]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder="0.0" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Notes</label>
                <textarea className="input-dark resize-none" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observations, commentaires..." />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-[#2d3748]">
              <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">Annuler</button>
              <button onClick={handleAddMeasurement} className="btn-primary flex-1">Enregistrer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
