import { NextResponse } from 'next/server';
import { runLiveAnalysis } from '@/lib/server/platformData';

export async function POST(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const result = await runLiveAnalysis(id);

  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
