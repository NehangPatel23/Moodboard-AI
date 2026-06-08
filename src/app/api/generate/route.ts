import { NextResponse } from 'next/server';
import { getConfiguredGenerationProvider } from '@/lib/generation-provider';

export async function GET() {
  const provider = getConfiguredGenerationProvider();
  return NextResponse.json({ provider });
}
