import { NextResponse } from 'next/server';
import { fetchPublicProfile, isValidProfileId } from '@/lib/public-profile';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (!isValidProfileId(id)) {
    return NextResponse.json({ error: 'Invalid profile id' }, { status: 400 });
  }

  try {
    const result = await fetchPublicProfile(id);

    if (!result) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load profile';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
