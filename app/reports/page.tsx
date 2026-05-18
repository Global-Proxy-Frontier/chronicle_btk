import PlatformShell from '@/components/platform/PlatformShell';

export default function ReportsPage() {
  return (
    <PlatformShell title="Raporlama ve Export">
      <div className="grid gap-4 md:grid-cols-3">
        <a href="/api/platform/export/customers-xlsx" className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900">
          <h2 className="text-sm font-semibold text-cyan-300">Excel XLSX Toplu Export</h2>
          <p className="mt-2 text-xs text-slate-400">1000 kayitlik ozet risk tablosunu .xlsx formatinda indirir.</p>
        </a>

        <a href="/api/platform/export/customers-csv" className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900">
          <h2 className="text-sm font-semibold text-cyan-300">Excel/CSV Toplu Export</h2>
          <p className="mt-2 text-xs text-slate-400">1000 kayitlik ozet risk tablosunu indirir.</p>
        </a>

        <a href="/customers" className="rounded-xl border border-slate-800 bg-slate-950 p-4 hover:bg-slate-900">
          <h2 className="text-sm font-semibold text-cyan-300">Tek Vaka PDF/TXT</h2>
          <p className="mt-2 text-xs text-slate-400">Inceleme listesinden vaka secip tek rapor indir.</p>
        </a>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
          <h2 className="text-sm font-semibold text-cyan-300">Ham Veri CSV</h2>
          <p className="mt-2 text-xs text-slate-400">Bu surumde ozet export uzerinden saglanir. Detay ham export bir sonraki iterasyonda parcali sunulur.</p>
        </div>
      </div>
    </PlatformShell>
  );
}
