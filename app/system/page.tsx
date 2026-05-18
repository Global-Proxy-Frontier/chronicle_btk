import PlatformShell from '@/components/platform/PlatformShell';
import ResetLiveCacheButton from '@/components/platform/ResetLiveCacheButton';
import { getMixedDemoCustomerIds, getLiveCache } from '@/lib/server/platformData';

export default function SystemPage() {
  const demoIds = getMixedDemoCustomerIds();
  const cache = getLiveCache();

  return (
    <PlatformShell title="Sistem ve Ayarlar">
      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <h2 className="mb-3 text-sm font-semibold text-cyan-300">Canli Demo Analiz Kontrolu</h2>
          <p className="mb-3 text-xs text-slate-400">Canli analiz yalnizca sabit 5 kayit icin aciktir.</p>
          <div className="mb-4 text-xs text-slate-300">Demo ID: {demoIds.join(', ')}</div>
          <ResetLiveCacheButton />
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <h2 className="mb-3 text-sm font-semibold text-cyan-300">Canli Cache Durumu</h2>
          <p className="text-xs text-slate-400">Son guncelleme: {new Date(cache.updated_at).toLocaleString('tr-TR')}</p>
          <ul className="mt-3 space-y-1 text-xs text-slate-200">
            {Object.keys(cache.entries).length === 0 ? (
              <li>Cache bos.</li>
            ) : (
              Object.keys(cache.entries).map((id) => <li key={id}>- {id}</li>)
            )}
          </ul>
        </section>
      </div>
    </PlatformShell>
  );
}
