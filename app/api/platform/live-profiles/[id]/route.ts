import { NextResponse } from 'next/server';
import { getLiveCache, getLiveProfileDetail } from '@/lib/server/platformData';

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const detail = getLiveProfileDetail(id);

  if (!detail) {
    return NextResponse.json({ error: 'canli profil bulunamadi veya yetkisiz id' }, { status: 404 });
  }

  const cache = getLiveCache();

  return NextResponse.json({
    detail,
    live_cache: cache.entries[id] || null,
  });
}
