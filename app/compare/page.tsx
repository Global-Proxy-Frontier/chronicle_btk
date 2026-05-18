import PlatformShell from '@/components/platform/PlatformShell';
import { getCompareData, getMixedDemoCustomerIds } from '@/lib/server/platformData';

export default function ComparePage() {
  const rows = getCompareData();
  const demoIds = getMixedDemoCustomerIds();

  return (
    <PlatformShell title="Karsilastirma (5 Canli Kayit)">
      <p className="mb-3 text-xs text-slate-400">Karisik senaryo: normal + orta risk + yuksek risk birlikte.</p>
      <div className="mb-4 rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300">
        Demo ID Seti: {demoIds.join(', ')}
      </div>

      <div className="overflow-auto rounded-xl border border-slate-800 bg-slate-950">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-900 text-slate-400">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Ad</th>
              <th className="px-3 py-2">Risk Skoru</th>
              <th className="px-3 py-2">Risk Seviyesi</th>
              <th className="px-3 py-2">Islem</th>
              <th className="px-3 py-2">Cross-Border</th>
              <th className="px-3 py-2">Nakit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.customer_id} className="border-t border-slate-800">
                <td className="px-3 py-2">{r.customer_id}</td>
                <td className="px-3 py-2">{r.full_name}</td>
                <td className="px-3 py-2">{r.risk?.risk_score}</td>
                <td className="px-3 py-2">{r.risk?.risk_tier}</td>
                <td className="px-3 py-2">{r.summary?.transaction_count}</td>
                <td className="px-3 py-2">{r.summary?.cross_border_count}</td>
                <td className="px-3 py-2">{r.summary?.cash_count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PlatformShell>
  );
}
