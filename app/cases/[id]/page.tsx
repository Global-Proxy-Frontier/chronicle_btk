import Link from 'next/link';
import PlatformShell from '@/components/platform/PlatformShell';
import LiveAnalyzePanel from '@/components/platform/LiveAnalyzePanel';
import ExportCaseButtons from '@/components/platform/ExportCaseButtons';
import PersonalAnalysisCharts from '@/components/platform/PersonalAnalysisCharts';
import { getCustomerDetail, getMixedDemoCustomerIds } from '@/lib/server/platformData';

function riskPillClass(tier?: string) {
  if (tier === 'HIGH') return 'risk-pill-high';
  if (tier === 'MEDIUM') return 'risk-pill-medium';
  return 'risk-pill-low';
}

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = getCustomerDetail(id, 220);

  if (!detail) {
    return (
      <PlatformShell title="Vaka Detayi">
        <p className="text-sm text-red-300">Kayit bulunamadi.</p>
      </PlatformShell>
    );
  }

  const demoIds = getMixedDemoCustomerIds();
  const isDemo = demoIds.includes(id);

  return (
    <PlatformShell title={`Vaka Detayi - ${detail.customer.customer_id}`}>
      <div className="grid gap-4 lg:grid-cols-3">
        <section className="panel-card p-4 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="section-heading mb-1">Profil ve Risk Ozeti</h2>
              <p className="text-xs muted-text">Musteri profili, KYC bilgisi ve risk skoru bir arada.</p>
            </div>
            <span className={riskPillClass(detail.risk?.risk_tier)}>
              {detail.risk?.risk_tier || 'LOW'} | Skor {detail.risk?.risk_score || 0}
            </span>
          </div>

          <div className="grid gap-2 text-xs md:grid-cols-2">
            <div><span className="text-slate-400">Ad:</span> {detail.customer.full_name}</div>
            <div><span className="text-slate-400">ID:</span> {detail.customer.customer_id}</div>
            <div><span className="text-slate-400">Uyruk:</span> {detail.customer.nationality}</div>
            <div><span className="text-slate-400">Ikamet:</span> {detail.customer.residency_country}</div>
            <div><span className="text-slate-400">KYC:</span> {detail.customer.kyc_level}</div>
            <div><span className="text-slate-400">Cross-border:</span> {detail.summary?.cross_border_count || '0'}</div>
          </div>

          <h3 className="mt-5 mb-2 text-sm font-semibold text-slate-100">Son Islemler</h3>
          <div className="max-h-[400px] overflow-auto rounded-lg border border-slate-700/55 custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/70 text-slate-300">
                <tr>
                  <th className="px-2 py-1.5">Zaman</th>
                  <th className="px-2 py-1.5">Yon</th>
                  <th className="px-2 py-1.5">Tutar TRY</th>
                  <th className="px-2 py-1.5">Kanal</th>
                  <th className="px-2 py-1.5">Kategori</th>
                  <th className="px-2 py-1.5">IP</th>
                </tr>
              </thead>
              <tbody>
                {detail.transactions.slice(0, 120).map((tx) => (
                  <tr key={tx.transaction_id} className="border-t border-slate-700/50 text-slate-100 hover:bg-slate-900/35">
                    <td className="px-2 py-1.5">{tx.transaction_datetime}</td>
                    <td className="px-2 py-1.5">{tx.direction}</td>
                    <td className="px-2 py-1.5">{Number(tx.amount_try || 0).toLocaleString('tr-TR')}</td>
                    <td className="px-2 py-1.5">{tx.channel}</td>
                    <td className="px-2 py-1.5">{tx.category}</td>
                    <td className="px-2 py-1.5">{tx.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="space-y-4">
          <div className="panel-card p-4">
            <h2 className="mb-2 text-sm font-semibold text-slate-100">Hizli Aksiyonlar</h2>
            <div className="mb-2 space-y-2 text-xs">
              <Link href="/map" className="block rounded border border-slate-600/70 px-3 py-2 text-slate-100 hover:border-slate-300/75 hover:bg-slate-900/60">Haritada Gor</Link>
              <Link href="/live-analyses" className="block rounded border border-slate-600/70 px-3 py-2 text-slate-100 hover:border-slate-300/75 hover:bg-slate-900/60">Canli 5 Profil Merkezi</Link>
            </div>
            <ExportCaseButtons detail={detail} />
          </div>

          {isDemo ? (
            <LiveAnalyzePanel customerId={id} />
          ) : (
            <div className="panel-card p-4 text-xs text-slate-300">
              Canli analiz yalnizca sabit 5 demo kayit icin aciktir.
            </div>
          )}
        </section>
      </div>

      {isDemo ? (
        <div className="mt-4">
          <PersonalAnalysisCharts analytics={detail.analytics} />
        </div>
      ) : null}
    </PlatformShell>
  );
}
