'use client';

import { useState } from 'react';

export default function LiveAnalyzePanel({ customerId }: { customerId: string }) {
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState('');

  const runAnalysis = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/platform/demo-live/${customerId}`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setError(json.message || 'Canli analiz basarisiz.');
        return;
      }
      setText(json.data.analysis || 'Yanit bos.');
    } catch {
      setError('Baglanti hatasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-cyan-300">Canli Local Model Analizi</h3>
        <button
          onClick={runAnalysis}
          disabled={loading}
          className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-1.5 text-xs text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50"
        >
          {loading ? 'Hesaplaniyor...' : 'Canli Analiz Et'}
        </button>
      </div>
      <p className="mb-2 text-xs text-slate-400">Bu aksiyon yalnizca sabit 5 demo kayit icin aciktir.</p>
      {error && <p className="mb-2 text-xs text-red-300">{error}</p>}
      {text && <pre className="max-h-[380px] overflow-auto whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-200">{text}</pre>}
    </section>
  );
}
