import Link from 'next/link';
import PlatformShell from '@/components/platform/PlatformShell';
import { getLiveDemoProfiles } from '@/lib/server/platformData';

function riskPillClass(tier?: string) {
  if (tier === 'HIGH') return 'risk-pill-high';
  if (tier === 'MEDIUM') return 'risk-pill-medium';
  return 'risk-pill-low';
}

export default function LiveAnalysesPage() {
  const profiles = getLiveDemoProfiles();

  return (
    <PlatformShell title="Canli Analiz Profilleri">
      <section className="panel-card p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="section-heading mb-1">5 Canli Profil Merkezi</h2>
            <p className="text-xs muted-text">Demo ortaminda canli analiz acik 5 kisiye ozel derin inceleme ekranlari.</p>
          </div>
          <span className="panel-soft rounded-xl px-3 py-1.5 text-xs text-slate-100">Toplam: {profiles.length} profil</span>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => (
            <article key={profile.customer_id} className="panel-soft rounded-2xl p-3">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-slate-100">{profile.full_name}</p>
                  <p className="text-[11px] text-slate-300">{profile.customer_id}</p>
                </div>
                <span className={riskPillClass(profile.risk_tier)}>{profile.risk_tier}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-slate-200">
                <div>
                  <p className="text-slate-400">Risk skor</p>
                  <p className="font-semibold">{profile.risk_score}</p>
                </div>
                <div>
                  <p className="text-slate-400">Islem sayisi</p>
                  <p className="font-semibold">{Number(profile.transaction_count || 0).toLocaleString('tr-TR')}</p>
                </div>
                <div>
                  <p className="text-slate-400">Cross-border</p>
                  <p className="font-semibold">{Number(profile.cross_border_count || 0).toLocaleString('tr-TR')}</p>
                </div>
                <div>
                  <p className="text-slate-400">Gece orani</p>
                  <p className="font-semibold">{profile.analytics.signals.night_tx_ratio}%</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <p className="text-[11px] text-slate-400">Son hareket: {profile.last_transaction_at || 'yok'}</p>
                <Link
                  href={`/live-analyses/${profile.customer_id}`}
                  className="rounded-lg border border-slate-500/70 bg-slate-900/40 px-2.5 py-1 text-xs text-slate-100 hover:border-slate-200/80 hover:bg-slate-900/70"
                >
                  Derin Incele
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </PlatformShell>
  );
}
