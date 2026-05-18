'use client';

import { useState } from 'react';

export default function ResetLiveCacheButton() {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const onReset = async () => {
    setLoading(true);
    setStatus('');
    try {
      const res = await fetch('/api/platform/demo-live/reset', { method: 'POST' });
      const json = await res.json();
      if (!res.ok) {
        setStatus('Reset basarisiz oldu.');
      } else {
        setStatus(`Canli demo cache sifirlandi (${new Date(json.updated_at).toLocaleString('tr-TR')}).`);
      }
    } catch {
      setStatus('Baglanti hatasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={onReset}
        disabled={loading}
        className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
      >
        {loading ? 'Sifirlaniyor...' : 'Canli 5 Kisi Cache Reset'}
      </button>
      <p className="text-xs text-slate-400">Bu islem 1000 kisilik precompute veriye dokunmaz.</p>
      {status && <p className="text-xs text-emerald-300">{status}</p>}
    </div>
  );
}
