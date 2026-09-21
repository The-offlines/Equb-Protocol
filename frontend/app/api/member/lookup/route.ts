import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { walletAddress } = await request.json() as { walletAddress: string };

    if (!walletAddress) {
      return NextResponse.json({ error: 'walletAddress is required' }, { status: 400 });
    }

    const user = await prisma.user.findFirst({
      where: { walletAddress: { equals: walletAddress, mode: 'insensitive' } },
      select: { email: true, username: true },
    });

    return NextResponse.json({ email: user?.email ?? null, username: user?.username ?? null });
  } catch (error) {
    console.error('POST /api/member/lookup error:', error);
    return NextResponse.json({ error: 'Failed to lookup member' }, { status: 500 });
  }
}
