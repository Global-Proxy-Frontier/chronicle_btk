import { NextResponse } from 'next/server';
import { getLiveCache, getLiveDemoProfiles, getMixedDemoCustomerIds } from '@/lib/server/platformData';

export async function GET() {
  const profiles = getLiveDemoProfiles();
  const demoIds = getMixedDemoCustomerIds();
  const cache = getLiveCache();

  return NextResponse.json({
    demo_ids: demoIds,
    profiles,
    cache_keys: Object.keys(cache.entries),
  });
}
