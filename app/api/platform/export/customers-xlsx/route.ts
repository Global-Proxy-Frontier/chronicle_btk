import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { getCustomersPage } from '@/lib/server/platformData';

export async function GET() {
  const rows = getCustomersPage({ page: 1, size: 5000 }).rows;

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Customers');

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="customers_1000_export.xlsx"',
    },
  });
}
