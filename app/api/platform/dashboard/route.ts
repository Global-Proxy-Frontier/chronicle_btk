import { NextResponse } from 'next/server';
import { getDashboardData, getMixedDemoCustomerIds, getLiveCache } from '@/lib/server/platformData';

export async function GET() {
  const data = getDashboardData();
  const demoIds = getMixedDemoCustomerIds();
  const liveCache = getLiveCache();

  return NextResponse.json({
    ...data,
    demo_ids: demoIds,
    live_cache_keys: Object.keys(liveCache.entries),
  });
}
