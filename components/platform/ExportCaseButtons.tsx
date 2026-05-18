'use client';

import jsPDF from 'jspdf';

type Props = {
  detail: {
    customer: Record<string, string>;
    risk: { risk_score: number; risk_tier: string } | null;
    summary: Record<string, string> | null;
    transactions: Array<Record<string, string>>;
  };
};

export default function ExportCaseButtons({ detail }: Props) {
  const exportPdf = () => {
    const doc = new jsPDF();
    let y = 16;

    doc.setFontSize(16);
    doc.text('AML Vaka Raporu', 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.text(`Musteri: ${detail.customer.full_name}`, 14, y); y += 6;
    doc.text(`ID: ${detail.customer.customer_id}`, 14, y); y += 6;
    doc.text(`Risk: ${detail.risk?.risk_score || '-'} (${detail.risk?.risk_tier || '-'})`, 14, y); y += 6;
    doc.text(`Islem Sayisi: ${detail.summary?.transaction_count || '-'}`, 14, y); y += 8;

    doc.setFontSize(11);
    doc.text('Son 12 Islem', 14, y);
    y += 6;

    doc.setFontSize(8);
    for (const tx of detail.transactions.slice(0, 12)) {
      const line = `${tx.transaction_datetime} | ${tx.direction} | ${tx.amount_try} TRY | ${tx.channel} | ${tx.category}`;
      const wrapped = doc.splitTextToSize(line, 180);
      for (const w of wrapped) {
        if (y > 280) {
          doc.addPage();
          y = 16;
        }
        doc.text(w, 14, y);
        y += 4;
      }
      y += 1;
    }

    doc.save(`${detail.customer.customer_id}_vaka_raporu.pdf`);
  };

  const exportCsv = () => {
    const headers = ['transaction_datetime', 'direction', 'amount_try', 'channel', 'category', 'ip_address'];
    const lines = [headers.join(',')];
    for (const tx of detail.transactions) {
      lines.push([
        tx.transaction_datetime,
        tx.direction,
        tx.amount_try,
        tx.channel,
        tx.category,
        tx.ip_address,
      ].map((v) => `"${String(v || '').replace(/"/g, '""')}"`).join(','));
    }

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${detail.customer.customer_id}_islemler.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-2 text-xs">
      <button onClick={exportPdf} className="block w-full rounded border border-slate-700 px-3 py-2 text-left hover:bg-slate-800">
        Tek Vaka PDF Indir
      </button>
      <button onClick={exportCsv} className="block w-full rounded border border-slate-700 px-3 py-2 text-left hover:bg-slate-800">
        Tek Vaka CSV Indir
      </button>
    </div>
  );
}
