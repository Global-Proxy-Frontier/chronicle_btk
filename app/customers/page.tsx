import Link from 'next/link';
import PlatformShell from '@/components/platform/PlatformShell';
import { getCustomersPage } from '@/lib/server/platformData';

function riskPillClass(tier: string) {
  if (tier === 'HIGH') {
    return 'risk-pill-high';
  }
  if (tier === 'MEDIUM') {
    return 'risk-pill-medium';
  }
  return 'risk-pill-low';
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tier?: string; page?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page || '1');
  const data = getCustomersPage({
    q: params.q || '',
    tier: params.tier || '',
    page,
    size: 100,
  });

  const totalPages = Math.max(1, Math.ceil(data.total / data.size));
  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);
  const hasPrev = page > 1;
  const hasNext = page < totalPages;

  return (
    <PlatformShell title="Inceleme Listesi">
      <section className="panel-card mb-4 p-4">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-sky-200/85">Smart Filters</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-50">Risk odakli musteri taramasi</h2>
          </div>
          <div className="panel-soft rounded-xl px-3 py-2 text-xs text-slate-200">
            Toplam kayit: <span className="font-semibold text-slate-50">{data.total}</span>
          </div>
        </div>

        <form className="grid gap-3 md:grid-cols-[2fr_1fr_auto]">
          <input
            name="q"
            defaultValue={params.q || ''}
            placeholder="ID, ad, ulke veya profile gore ara"
            className="input-field"
          />
          <select name="tier" defaultValue={params.tier || ''} className="input-field">
            <option value="">Tum Risk Seviyeleri</option>
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
          </select>
          <button className="btn-primary">Filtrele</button>
        </form>
      </section>

      <section className="panel-card overflow-hidden">
        <div className="max-h-[64vh] overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-950/80 text-xs uppercase tracking-[0.08em] text-slate-300 backdrop-blur">
              <tr>
                <th className="px-3 py-3">ID</th>
                <th className="px-3 py-3">Ad</th>
                <th className="px-3 py-3">Skor</th>
                <th className="px-3 py-3">Seviye</th>
                <th className="px-3 py-3">Cross-Border</th>
                <th className="px-3 py-3">Islem</th>
                <th className="px-3 py-3">Detay</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.customer_id} className="border-t border-slate-700/45 text-slate-100 hover:bg-slate-900/35">
                  <td className="px-3 py-2.5 font-semibold text-sky-200">{row.customer_id}</td>
                  <td className="px-3 py-2.5">{row.full_name}</td>
                  <td className="px-3 py-2.5">{row.risk_score}</td>
                  <td className="px-3 py-2.5">
                    <span className={riskPillClass(row.risk_tier)}>{row.risk_tier}</span>
                  </td>
                  <td className="px-3 py-2.5">{row.cross_border_count}</td>
                  <td className="px-3 py-2.5">{row.transaction_count}</td>
                  <td className="px-3 py-2.5">
                    <Link href={`/cases/${row.customer_id}`} className="text-sky-300 hover:text-sky-100 hover:underline">
                      Ac
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-200">
        <span className="muted-text">
          Sayfa: {page} / {totalPages}
        </span>
        <div className="flex items-center gap-2">
          <Link
            href={`/customers?page=${prevPage}&q=${encodeURIComponent(params.q || '')}&tier=${encodeURIComponent(params.tier || '')}`}
            className={hasPrev ? 'btn-ghost' : 'btn-ghost pointer-events-none opacity-45'}
          >
            Onceki
          </Link>
          <Link
            href={`/customers?page=${nextPage}&q=${encodeURIComponent(params.q || '')}&tier=${encodeURIComponent(params.tier || '')}`}
            className={hasNext ? 'btn-ghost' : 'btn-ghost pointer-events-none opacity-45'}
          >
            Sonraki
          </Link>
        </div>
      </div>
    </PlatformShell>
  );
}
