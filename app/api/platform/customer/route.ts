import { NextRequest, NextResponse } from 'next/server';
import { getCustomerDetail } from '@/lib/server/platformData';

export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get('id');
  const limit = Number(req.nextUrl.searchParams.get('limit') || 120);

  if (!customerId) {
    return NextResponse.json({ error: 'id zorunlu' }, { status: 400 });
  }

  const data = getCustomerDetail(customerId, limit);
  if (!data) {
    return NextResponse.json({ error: 'musteri bulunamadi' }, { status: 404 });
  }

  return NextResponse.json(data);
}
