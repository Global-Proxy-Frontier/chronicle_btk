'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  Brush,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  Radar,
  RadarChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type AnalyticsPayload = {
  daily_volume_30: Array<{ date: string; count: number; amount_try: number }>;
  hour_distribution: Array<{ name: string; count: number }>;
  weekday_distribution: Array<{ name: string; count: number }>;
  channel_distribution: Array<{ name: string; count: number }>;
  category_distribution: Array<{ name: string; count: number }>;
  top_routes: Array<{ name: string; count: number }>;
  amount_bands: Array<{ name: string; count: number; total_amount: number }>;
  signals: {
    tx_count: number;
    cross_border_ratio: number;
    night_tx_ratio: number;
    unique_ip_ratio: number;
    avg_amount_try: number;
    max_amount_try: number;
    unique_ip_count: number;
    single_use_ip_count: number;
  };
};

const palette = ['#7ea6d9', '#76b2ce', '#76c5bd', '#8db9a2', '#aeb9a0', '#b8afc8', '#8ca4bf'];

function SoftTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-500/55 bg-slate-950/95 px-3 py-2 text-xs text-slate-50">
      {label && <p className="mb-1 text-[11px] text-slate-200">{label}</p>}
      {payload.map((item: any) => {
        const val = Number(item.value || 0);
        return (
          <p key={item.dataKey} style={{ color: item.color || '#cfe3ff' }}>
            <span className="text-slate-300">{item.name}: </span>
            {Number.isFinite(val) ? val.toLocaleString('tr-TR') : '0'}
          </p>
        );
      })}
    </div>
  );
}

function signalBadge(value: number, threshold: number) {
  return value >= threshold ? 'risk-pill-high' : value >= threshold * 0.65 ? 'risk-pill-medium' : 'risk-pill-low';
}

export default function PersonalAnalysisCharts({ analytics }: { analytics: AnalyticsPayload }) {
  const [dayWindow, setDayWindow] = useState<14 | 30>(30);
  const [bandMetric, setBandMetric] = useState<'count' | 'total_amount'>('count');

  const daily = useMemo(
    () =>
      analytics.daily_volume_30.slice(-dayWindow).map((row) => ({
        ...row,
        shortDate: row.date.slice(5).replace('-', '/'),
        amount_million: Number((row.amount_try / 1_000_000).toFixed(2)),
      })),
    [analytics.daily_volume_30, dayWindow]
  );

  const behaviourRadar = useMemo(
    () => [
      { name: 'CrossBorder', value: analytics.signals.cross_border_ratio },
      { name: 'Gece', value: analytics.signals.night_tx_ratio },
      { name: 'UniqueIP', value: analytics.signals.unique_ip_ratio },
      { name: 'SingleIP', value: Number(((analytics.signals.single_use_ip_count / Math.max(1, analytics.signals.tx_count)) * 100).toFixed(1)) },
    ],
    [analytics.signals]
  );

  return (
    <section className="panel-card space-y-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="section-heading mb-0">Kisiye Ozel Analitik Panel</h3>
        <div className="panel-soft rounded-xl px-3 py-1.5 text-xs text-slate-100">Interaktif drill-down aktif</div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <div className="panel-soft rounded-xl p-3 text-xs">
          <p className="text-slate-300">Cross-border oran</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={signalBadge(analytics.signals.cross_border_ratio, 35)}>{analytics.signals.cross_border_ratio}%</span>
          </div>
        </div>
        <div className="panel-soft rounded-xl p-3 text-xs">
          <p className="text-slate-300">Gece islem oran</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={signalBadge(analytics.signals.night_tx_ratio, 28)}>{analytics.signals.night_tx_ratio}%</span>
          </div>
        </div>
        <div className="panel-soft rounded-xl p-3 text-xs">
          <p className="text-slate-300">Unique IP oran</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={signalBadge(analytics.signals.unique_ip_ratio, 25)}>{analytics.signals.unique_ip_ratio}%</span>
          </div>
        </div>
        <div className="panel-soft rounded-xl p-3 text-xs">
          <p className="text-slate-300">Maksimum tutar</p>
          <p className="mt-1 text-sm font-semibold text-slate-50">{analytics.signals.max_amount_try.toLocaleString('tr-TR')} TRY</p>
        </div>
      </div>

      <div className="panel-soft flex flex-wrap items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-100">
        <span>Zaman penceresi:</span>
        {[14, 30].map((value) => (
          <button
            key={`day-${value}`}
            type="button"
            onClick={() => setDayWindow(value as 14 | 30)}
            className={
              dayWindow === value
                ? 'rounded-lg border border-sky-300/70 bg-sky-500/20 px-2 py-1 text-slate-50'
                : 'rounded-lg border border-slate-600/80 bg-slate-900/35 px-2 py-1 text-slate-200 hover:border-slate-400'
            }
          >
            Son {value} gun
          </button>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="panel-soft rounded-2xl p-3 xl:col-span-2">
          <h4 className="mb-2 text-sm font-semibold text-slate-100">Gunluk hareket ve hacim</h4>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
              <ComposedChart data={daily} margin={{ top: 12, right: 8, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(154,176,216,0.22)" vertical={false} />
                <XAxis dataKey="shortDate" tickLine={false} axisLine={false} tick={{ fill: '#c5d4ee', fontSize: 11 }} />
                <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fill: '#c5d4ee', fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fill: '#c5d4ee', fontSize: 11 }} tickFormatter={(v) => `${v}M`} />
                <Tooltip content={<SoftTooltip />} />
                <Legend formatter={(value) => <span className="text-slate-200">{value}</span>} />
                <Bar yAxisId="left" dataKey="count" name="Islem adedi" fill="#769fce" radius={[6, 6, 0, 0]} barSize={16} />
                <Line yAxisId="right" dataKey="amount_million" name="Hacim (M TRY)" stroke="#7ec2d4" strokeWidth={2.2} dot={false} />
                <Brush dataKey="shortDate" height={20} stroke="#7ebbd2" travellerWidth={10} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel-soft rounded-2xl p-3">
          <h4 className="mb-2 text-sm font-semibold text-slate-100">Davranis radari</h4>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
              <RadarChart data={behaviourRadar} outerRadius="72%">
                <PolarGrid stroke="rgba(154,176,216,0.34)" />
                <PolarAngleAxis dataKey="name" tick={{ fill: '#c5d4ee', fontSize: 11 }} />
                <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#8fa8cc', fontSize: 10 }} />
                <Radar dataKey="value" stroke="#7ec2d4" fill="#7ec2d4" fillOpacity={0.3} />
                <Tooltip content={<SoftTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="panel-soft rounded-2xl p-3">
          <h4 className="mb-2 text-sm font-semibold text-slate-100">Saatlik islem yogunlugu</h4>
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={230}>
              <BarChart data={analytics.hour_distribution} margin={{ top: 8, right: 6, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(154,176,216,0.22)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#c5d4ee', fontSize: 10 }} />
                <YAxis hide />
                <Tooltip content={<SoftTooltip />} />
                <Bar dataKey="count" name="Islem" radius={[6, 6, 0, 0]}>
                  {analytics.hour_distribution.map((row, i) => (
                    <Cell key={`hour-${row.name}`} fill={palette[i % palette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel-soft rounded-2xl p-3">
          <h4 className="mb-2 text-sm font-semibold text-slate-100">Haftalik dagilim</h4>
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={230}>
              <BarChart data={analytics.weekday_distribution} margin={{ top: 8, right: 6, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(154,176,216,0.22)" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: '#c5d4ee', fontSize: 10 }} />
                <YAxis hide />
                <Tooltip content={<SoftTooltip />} />
                <Bar dataKey="count" name="Islem" radius={[6, 6, 0, 0]} fill="#8db9a2" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel-soft rounded-2xl p-3">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-100">Tutar bandlari</h4>
            <div className="flex gap-1 text-[11px]">
              {(['count', 'total_amount'] as const).map((metric) => (
                <button
                  key={metric}
                  type="button"
                  onClick={() => setBandMetric(metric)}
                  className={
                    bandMetric === metric
                      ? 'rounded-md border border-sky-300/65 bg-sky-500/20 px-2 py-0.5 text-slate-50'
                      : 'rounded-md border border-slate-600/80 bg-slate-900/35 px-2 py-0.5 text-slate-200'
                  }
                >
                  {metric === 'count' ? 'Adet' : 'Tutar'}
                </button>
              ))}
            </div>
          </div>
          <div className="h-[230px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={230}>
              <PieChart>
                <Pie
                  data={analytics.amount_bands}
                  dataKey={bandMetric}
                  nameKey="name"
                  innerRadius={52}
                  outerRadius={90}
                  paddingAngle={3}
                  stroke="rgba(5,18,36,0.95)"
                  strokeWidth={2}
                >
                  {analytics.amount_bands.map((row, i) => (
                    <Cell key={`band-${row.name}`} fill={palette[i % palette.length]} />
                  ))}
                </Pie>
                <Tooltip content={<SoftTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="panel-soft rounded-2xl p-3">
        <h4 className="mb-2 text-sm font-semibold text-slate-100">Top rota ve kaynak ulke akislari</h4>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
            <BarChart data={analytics.top_routes.slice(0, 8)} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(154,176,216,0.22)" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={110} tickLine={false} axisLine={false} tick={{ fill: '#c5d4ee', fontSize: 10 }} />
              <Tooltip content={<SoftTooltip />} />
              <Bar dataKey="count" name="Islem" radius={[0, 8, 8, 0]} fill="#76b2ce" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </section>
  );
}
