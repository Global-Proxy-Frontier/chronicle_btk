import { NextResponse } from 'next/server';
import { getCustomerDetail } from '@/lib/server/platformData';

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const detail = getCustomerDetail(id, 80);

  if (!detail) {
    return NextResponse.json({ error: 'musteri bulunamadi' }, { status: 404 });
  }

  // Basit metin tabanli PDF benzeri rapor fallback'i: tarayici yazdirabilir.
  const report = [
    'AML Vaka Ozet Raporu',
    `Musteri: ${detail.customer.full_name}`,
    `ID: ${detail.customer.customer_id}`,
    `Risk Skoru: ${detail.risk?.risk_score || '-'} (${detail.risk?.risk_tier || '-'})`,
    `Islem Sayisi: ${detail.summary?.transaction_count || '-'}`,
    `Cross Border: ${detail.summary?.cross_border_count || '-'}`,
    '',
    'Son 10 Islem:',
    ...detail.transactions.slice(0, 10).map((tx) =>
      `${tx.transaction_datetime} | ${tx.direction} | ${tx.amount_try} TRY | ${tx.channel} | ${tx.category}`
    ),
  ].join('\n');

  return new NextResponse(report, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Content-Disposition': `attachment; filename="${id}_vaka_raporu.txt"`,
    },
  });
}
