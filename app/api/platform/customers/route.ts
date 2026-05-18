import { NextRequest, NextResponse } from 'next/server';
import { getCustomersPage } from '@/lib/server/platformData';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || '';
  const tier = req.nextUrl.searchParams.get('tier') || '';
  const page = Number(req.nextUrl.searchParams.get('page') || 1);
  const size = Number(req.nextUrl.searchParams.get('size') || 100);

  const data = getCustomersPage({ q, tier, page, size });
  return NextResponse.json(data);
}
