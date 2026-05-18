'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
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
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type NamedCount = {
  name: string;
  count: number;
};

type DailyPoint = {
  date: string;
  count: number;
  amount_try?: number;
};

type TopRiskRow = {
  customer_id: string;
  full_name: string;
  risk_score: number;
  risk_tier: string;
};

export type DashboardPayload = {
  updated_at: string;
  totals: {
    customers: number;
    accounts: number;
    transactions: number;
  };
  risk_distribution: NamedCount[];
  top10_risk: TopRiskRow[];
  channel: NamedCount[];
  category: NamedCount[];
  currency: NamedCount[];
  daily_volume: DailyPoint[];
  cross_border_ratio: number;
};

const numberFmt = new Intl.NumberFormat('tr-TR');

const riskColors: Record<string, string> = {
  HIGH: '#be6f7a',
  MEDIUM: '#c8a668',
  LOW: '#6ba88d',
};

const seriesColors = ['#7ea6d9', '#76b2ce', '#76c5bd', '#8db9a2', '#aeb9a0', '#b8afc8', '#8ca4bf'];

const chartGridStroke = 'rgba(154, 176, 216, 0.22)';
const chartAxisStroke = 'rgba(154, 176, 216, 0.3)';
const chartTickColor = '#c5d4ee';

function SoftTooltip({ active, payload, label }: any) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-500/50 bg-slate-950/95 px-3 py-2 text-xs text-slate-50 shadow-2xl">
      {label && <p className="mb-1 text-[11px] text-slate-200">{label}</p>}
      <div className="space-y-0.5">
        {payload.map((item: any) => {
          const value = Number(item.value || 0);
          return (
            <p key={item.dataKey} style={{ color: item.color || '#dbeafe' }}>
              <span className="text-slate-300">{item.name}: </span>
              {numberFmt.format(Number.isFinite(value) ? value : 0)}
            </p>
          );
        })}
      </div>
    </div>
  );
}

function riskPillClass(tier: string) {
  if (tier === 'HIGH') {
    return 'risk-pill-high';
  }
  if (tier === 'MEDIUM') {
    return 'risk-pill-medium';
  }
  return 'risk-pill-low';
}

function shortDate(date: string) {
  return date.slice(5).replace('-', '/');
}

function sortByCount(rows: NamedCount[]) {
  return [...rows].sort((a, b) => b.count - a.count);
}

function ChartPlaceholder({ height }: { height: number }) {
  return (
    <div
      className="animate-pulse rounded-xl border border-slate-700/60 bg-slate-900/40"
      style={{ height }}
      aria-hidden
    />
  );
}

export default function DashboardVisuals({ data }: { data: DashboardPayload }) {
  const [mounted, setMounted] = useState(false);
  const [windowDays, setWindowDays] = useState<7 | 14>(14);
  const [categoryTopN, setCategoryTopN] = useState<5 | 8 | 10>(8);

  useEffect(() => {
    setMounted(true);
  }, []);

  const totalRisk = data.risk_distribution.reduce((sum, item) => sum + item.count, 0);
  const dailySeries = data.daily_volume
    .map((point) => ({
      ...point,
      shortDate: shortDate(point.date),
      amount_million: Number(((point.amount_try || 0) / 1_000_000).toFixed(2)),
    }))
    .slice(-windowDays);

  const channelSeries = sortByCount(data.channel).slice(0, categoryTopN);
  const categorySeries = sortByCount(data.category).slice(0, categoryTopN);

  const currencyTotal = Math.max(
    1,
    data.currency.reduce((sum, row) => sum + row.count, 0)
  );

  const currencySeries = sortByCount(data.currency).map((row) => ({
    ...row,
    share: Number(((row.count / currencyTotal) * 100).toFixed(2)),
  }));

  const avgCount = Math.round(
    dailySeries.reduce((sum, point) => sum + point.count, 0) / Math.max(1, dailySeries.length)
  );

  const cards = [
    {
      label: 'Toplam Musteri',
      value: numberFmt.format(data.totals.customers),
      hint: 'Risk analizine dahil edilen kayit',
    },
    {
      label: 'Toplam Hesap',
      value: numberFmt.format(data.totals.accounts),
      hint: 'Musterilere bagli hesap adedi',
    },
    {
      label: 'Toplam Islem',
      value: numberFmt.format(data.totals.transactions),
      hint: 'On-islenmis tum hareketler',
    },
    {
      label: 'Cross-Border Orani',
      value: `%${data.cross_border_ratio}`,
      hint: 'Sinir otesi trafik yogunlugu',
    },
  ];

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => (
          <article key={card.label} className="stat-card animate-rise" style={{ animationDelay: `${index * 70}ms` }}>
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-300">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-50">{card.value}</p>
            <p className="mt-1 text-xs muted-text">{card.hint}</p>
          </article>
        ))}
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <section className="panel-card p-4 xl:col-span-1">
          <h2 className="section-heading">Risk Dagilimi (1000 Kayit)</h2>
          <div className="grid items-center gap-4 sm:grid-cols-[220px_1fr] xl:grid-cols-1">
            <div className="h-[230px] w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={230}>
                  <PieChart>
                    <Pie
                      data={data.risk_distribution}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={66}
                      outerRadius={96}
                      paddingAngle={3}
                      stroke="rgba(5, 18, 36, 0.95)"
                      strokeWidth={2}
                    >
                      {data.risk_distribution.map((entry) => (
                        <Cell key={`risk-${entry.name}`} fill={riskColors[entry.name] || '#60a5fa'} />
                      ))}
                    </Pie>
                    <Tooltip content={<SoftTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <ChartPlaceholder height={230} />
              )}
            </div>
            <div className="space-y-2">
              {data.risk_distribution.map((item) => {
                const share = totalRisk ? Math.round((item.count / totalRisk) * 100) : 0;
                return (
                  <div key={`risk-share-${item.name}`} className="panel-soft p-2.5">
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-100">{item.name}</span>
                      <span className="muted-text">{numberFmt.format(item.count)} kayit</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-slate-900/80">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.max(4, share)}%`,
                          backgroundColor: riskColors[item.name] || '#60a5fa',
                        }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] muted-text">Pay: %{share}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="panel-card p-4 xl:col-span-2">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h2 className="section-heading mb-0">Islem Trendi ve Hacim (Zoom/Brush)</h2>
            <div className="flex items-center gap-1">
              {[7, 14].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setWindowDays(value as 7 | 14)}
                  className={
                    windowDays === value
                      ? 'rounded-lg border border-sky-300/70 bg-sky-500/20 px-2 py-1 text-xs text-slate-50'
                      : 'rounded-lg border border-slate-600/75 bg-slate-900/35 px-2 py-1 text-xs text-slate-200 hover:border-slate-400'
                  }
                >
                  Son {value} gun
                </button>
              ))}
            </div>
          </div>

          <div className="h-[280px] w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={280}>
                <ComposedChart data={dailySeries} margin={{ top: 12, right: 8, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                  <XAxis
                    dataKey="shortDate"
                    tickLine={false}
                    axisLine={{ stroke: chartAxisStroke }}
                    tick={{ fill: chartTickColor, fontSize: 11 }}
                  />
                  <YAxis
                    yAxisId="left"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: chartTickColor, fontSize: 11 }}
                    allowDecimals={false}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: chartTickColor, fontSize: 11 }}
                    tickFormatter={(value) => `${value}M`}
                  />
                  <Tooltip content={<SoftTooltip />} />
                  <Legend
                    wrapperStyle={{ fontSize: '11px' }}
                    formatter={(value) => <span className="text-slate-200">{value}</span>}
                  />
                  <ReferenceLine
                    yAxisId="left"
                    y={avgCount}
                    stroke="rgba(120, 202, 184, 0.72)"
                    strokeDasharray="4 4"
                    label={{ value: 'Ortalama', position: 'insideTopLeft', fill: '#9fd4c7', fontSize: 10 }}
                  />
                  <Bar
                    yAxisId="left"
                    dataKey="count"
                    name="Islem adedi"
                    fill="#739fce"
                    radius={[6, 6, 0, 0]}
                    barSize={18}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="amount_million"
                    name="Hacim (M TRY)"
                    stroke="#7ec2d4"
                    strokeWidth={2.2}
                    dot={false}
                    activeDot={{ r: 4, fill: '#c0e6ef' }}
                  />
                  <Brush dataKey="shortDate" height={22} stroke="#7ebbd2" travellerWidth={10} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <ChartPlaceholder height={280} />
            )}
          </div>
          <p className="mt-2 text-xs muted-text">Grafana ve Superset yaklasimindaki gibi tek panelde hem adet hem hacim ve zoom/brush etkilesimi verildi.</p>
        </section>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-3">
          <div className="panel-soft inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-slate-100">
            <span>Dagilim detay seviyesi:</span>
            {[5, 8, 10].map((value) => (
              <button
                key={`top-${value}`}
                type="button"
                onClick={() => setCategoryTopN(value as 5 | 8 | 10)}
                className={
                  categoryTopN === value
                    ? 'rounded-lg border border-sky-300/70 bg-sky-500/20 px-2 py-1 text-slate-50'
                    : 'rounded-lg border border-slate-600/80 bg-slate-900/35 px-2 py-1 text-slate-200 hover:border-slate-400'
                }
              >
                Top {value}
              </button>
            ))}
          </div>
        </div>

        <section className="panel-card p-4">
          <h2 className="section-heading">Kanal Dagilimi</h2>
          <div className="h-[250px] w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
                <BarChart data={channelSeries} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={82}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: chartTickColor, fontSize: 11 }}
                  />
                  <Tooltip content={<SoftTooltip />} />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {channelSeries.map((row, index) => (
                      <Cell key={`channel-${row.name}`} fill={seriesColors[index % seriesColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartPlaceholder height={250} />
            )}
          </div>
        </section>

        <section className="panel-card p-4">
          <h2 className="section-heading">Kategori Dagilimi</h2>
          <div className="h-[250px] w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
                <BarChart data={categorySeries} layout="vertical" margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={96}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: chartTickColor, fontSize: 11 }}
                  />
                  <Tooltip content={<SoftTooltip />} />
                  <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                    {categorySeries.map((row, index) => (
                      <Cell key={`category-${row.name}`} fill={seriesColors[index % seriesColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartPlaceholder height={250} />
            )}
          </div>
        </section>

        <section className="panel-card p-4">
          <h2 className="section-heading">Para Birimi Dagilimi (%)</h2>
          <div className="h-[250px] w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={250}>
                <BarChart data={currencySeries} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartGridStroke} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: chartTickColor, fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: chartTickColor, fontSize: 11 }}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<SoftTooltip />} />
                  <Bar dataKey="share" name="Pay (%)" radius={[8, 8, 0, 0]}>
                    {currencySeries.map((row, index) => (
                      <Cell key={`currency-${row.name}`} fill={seriesColors[index % seriesColors.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ChartPlaceholder height={250} />
            )}
          </div>
        </section>
      </div>

      <section className="panel-card mt-4 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="section-heading mb-0">Top 10 Riskli Kayit</h2>
          <p className="text-xs muted-text">Drill-down icin ID baglantisi ile kisi detayina gecis yap.</p>
        </div>

        <div className="max-h-[340px] overflow-auto custom-scrollbar">
          <table className="w-full border-separate border-spacing-y-1.5 text-left text-sm">
            <thead className="text-xs uppercase tracking-[0.08em] text-slate-300">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Musteri</th>
                <th className="px-3 py-2">Skor</th>
                <th className="px-3 py-2">Risk</th>
              </tr>
            </thead>
            <tbody>
              {data.top10_risk.map((row) => (
                <tr key={row.customer_id} className="panel-soft">
                  <td className="rounded-l-xl px-3 py-2 font-semibold text-sky-200">
                    <Link href={`/cases/${row.customer_id}`} className="hover:underline">
                      {row.customer_id}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-slate-100">{row.full_name}</td>
                  <td className="px-3 py-2 text-slate-200">{row.risk_score}</td>
                  <td className="rounded-r-xl px-3 py-2">
                    <span className={riskPillClass(row.risk_tier)}>{row.risk_tier}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-3 text-xs muted-text">Son guncellenme: {new Date(data.updated_at).toLocaleString('tr-TR')}</p>
    </>
  );
}
