import { NextResponse } from 'next/server';
import { getMapOverview } from '@/lib/server/platformData';

export async function GET() {
  return NextResponse.json(getMapOverview());
}
