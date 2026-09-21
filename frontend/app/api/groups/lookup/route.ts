import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/src/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { contractAddress } = await request.json() as { contractAddress: string };

    if (!contractAddress) {
      return NextResponse.json({ error: 'contractAddress is required' }, { status: 400 });
    }

    const group = await prisma.group.findUnique({
      where: { contractAddress },
      select: {
        id: true,
        name: true,
        contributionAmount: true,
        maxMembers: true,
        dueDate: true,
        nextDueDate: true,
        roundDuration: true,
        members: {
          select: {
            walletAddress: true,
            email: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    return NextResponse.json({ group });
  } catch (error) {
    console.error('POST /api/groups/lookup error:', error);
    return NextResponse.json({ error: 'Failed to lookup group' }, { status: 500 });
  }
}
