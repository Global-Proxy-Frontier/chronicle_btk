import Link from 'next/link';
import { notFound } from 'next/navigation';
import PlatformShell from '@/components/platform/PlatformShell';
import LiveAnalyzePanel from '@/components/platform/LiveAnalyzePanel';
import PersonalAnalysisCharts from '@/components/platform/PersonalAnalysisCharts';
import { getLiveProfileDetail } from '@/lib/server/platformData';

function riskPillClass(tier?: string) {
  if (tier === 'HIGH') return 'risk-pill-high';
  if (tier === 'MEDIUM') return 'risk-pill-medium';
  return 'risk-pill-low';
}

export default async function LiveProfileDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = getLiveProfileDetail(id);

  if (!detail) {
    notFound();
  }

  return (
    <PlatformShell title={`Canli Profil - ${detail.customer.customer_id}`}>
      <section className="panel-card p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="section-heading mb-1">Canli Kisiye Ozel Analiz</h2>
            <p className="text-xs muted-text">Profil, risk, davranis sinyalleri ve LLM canli yorum ayni sayfada.</p>
          </div>
          <span className={riskPillClass(detail.risk?.risk_tier)}>
            {detail.risk?.risk_tier || 'LOW'} | Skor {detail.risk?.risk_score || 0}
          </span>
        </div>

        <div className="grid gap-3 text-xs md:grid-cols-3">
          <div className="panel-soft rounded-xl p-3">
            <p className="text-slate-400">Musteri</p>
            <p className="text-sm font-semibold text-slate-100">{detail.customer.full_name}</p>
            <p className="text-[11px] text-slate-300">{detail.customer.customer_id}</p>
          </div>
          <div className="panel-soft rounded-xl p-3">
            <p className="text-slate-400">Islem ozeti</p>
            <p className="text-sm font-semibold text-slate-100">{Number(detail.summary?.transaction_count || 0).toLocaleString('tr-TR')} hareket</p>
            <p className="text-[11px] text-slate-300">Cross-border: {Number(detail.summary?.cross_border_count || 0).toLocaleString('tr-TR')}</p>
          </div>
          <div className="panel-soft rounded-xl p-3">
            <p className="text-slate-400">Profil</p>
            <p className="text-sm font-semibold text-slate-100">{detail.customer.nationality} / {detail.customer.residency_country}</p>
            <p className="text-[11px] text-slate-300">KYC: {detail.customer.kyc_level}</p>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <Link href={`/cases/${detail.customer.customer_id}`} className="rounded-lg border border-slate-500/70 bg-slate-900/40 px-3 py-1.5 text-slate-100 hover:border-slate-200/80 hover:bg-slate-900/70">
            Vaka sayfasina git
          </Link>
          <Link href="/live-analyses" className="rounded-lg border border-slate-500/70 bg-slate-900/40 px-3 py-1.5 text-slate-100 hover:border-slate-200/80 hover:bg-slate-900/70">
            5 profil listesine don
          </Link>
        </div>
      </section>

      <div className="mt-4">
        <PersonalAnalysisCharts analytics={detail.analytics} />
      </div>

      <div className="mt-4">
        <LiveAnalyzePanel customerId={detail.customer.customer_id} />
      </div>
    </PlatformShell>
  );
}
