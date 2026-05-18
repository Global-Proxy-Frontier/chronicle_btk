import PlatformShell from '@/components/platform/PlatformShell';
import WorldFlowMap from '@/components/platform/WorldFlowMap';
import { getMapOverview } from '@/lib/server/platformData';

export default function MapPage() {
  const map = getMapOverview();
  const flows = map.flows
    .filter((f) =>
      Number.isFinite(f.source_latitude) &&
      Number.isFinite(f.source_longitude) &&
      Number.isFinite(f.destination_latitude) &&
      Number.isFinite(f.destination_longitude)
    )
    .slice(0, 180);
  const maxRouteCount = Math.max(...map.top_routes.map((r) => r.count), 1);
  const highRiskFlowCount = flows.filter((flow) => flow.risk_tier === 'HIGH').length;

  return (
    <PlatformShell title="Harita ve Ag Analizi">
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="panel-card p-4 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="section-heading mb-1">Global Flow Visibility</h2>
              <p className="text-xs muted-text">Konum/IP tutarsizligi ve risk yogunlugu tek haritada izlenir.</p>
            </div>
            <div className="panel-soft rounded-xl px-3 py-2 text-xs text-slate-200">Yuksek risk akis: {highRiskFlowCount}</div>
          </div>

          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            <div className="panel-soft rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-300">Toplam akis</p>
              <p className="mt-1 text-xl font-semibold text-slate-50">{map.flow_count}</p>
            </div>
            <div className="panel-soft rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-300">Gosterilen</p>
              <p className="mt-1 text-xl font-semibold text-slate-50">{flows.length}</p>
            </div>
            <div className="panel-soft rounded-xl p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-slate-300">Anomali IP</p>
              <p className="mt-1 text-xl font-semibold text-slate-50">{map.ip_anomalies.length}</p>
            </div>
          </div>

          <WorldFlowMap flows={flows} />
        </section>

        <div className="space-y-4">
          <section className="panel-card p-4">
            <h2 className="section-heading">Top Rotalar</h2>
            <ul className="space-y-2 text-xs text-slate-100">
              {map.top_routes.map((r) => (
                <li key={r.route} className="panel-soft rounded-xl p-2.5">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="truncate pr-2">{r.route}</span>
                    <span className="text-sky-200">{r.count}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-900/70">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-sky-400/80 to-blue-300/70"
                      style={{ width: `${Math.max(6, Math.round((r.count / maxRouteCount) * 100))}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel-card p-4">
            <h2 className="section-heading">IP Farkliligi (Anomali)</h2>
            <ul className="space-y-2 text-xs text-slate-100">
              {map.ip_anomalies.map((ip) => (
                <li key={ip.ip} className="panel-soft rounded-xl p-2.5">
                  <div className="font-medium text-slate-50">{ip.ip}</div>
                  <div className="mt-1 muted-text">Ulke sayisi: {ip.country_count} | Islem: {ip.count}</div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </PlatformShell>
  );
}
