import { NextResponse } from 'next/server';
import { getCustomersPage } from '@/lib/server/platformData';

export async function GET() {
  const data = getCustomersPage({ page: 1, size: 5000 }).rows;

  const headers = [
    'customer_id',
    'full_name',
    'risk_score',
    'risk_tier',
    'nationality',
    'residency_country',
    'transaction_count',
    'cross_border_count',
    'cash_count',
    'incoming_total_try',
    'outgoing_total_try',
  ];

  const lines = [headers.join(',')];
  for (const row of data) {
    lines.push([
      row.customer_id,
      `"${(row.full_name || '').replace(/"/g, '""')}"`,
      row.risk_score,
      row.risk_tier,
      row.nationality,
      row.residency_country,
      row.transaction_count,
      row.cross_border_count,
      row.cash_count,
      row.incoming_total_try,
      row.outgoing_total_try,
    ].join(','));
  }

  return new NextResponse(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="customers_1000_export.csv"',
    },
  });
}
