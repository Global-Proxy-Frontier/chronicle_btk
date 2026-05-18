import { NextResponse } from 'next/server';
import { resetLiveDemoCache } from '@/lib/server/platformData';

export async function POST() {
  const result = resetLiveDemoCache();
  return NextResponse.json(result);
}
