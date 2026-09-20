import { NextRequest, NextResponse } from "next/server";
import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";
import { prisma } from "@/src/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userToken, contractAddress } = body;

    if (!userToken || !contractAddress) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Circle API key is not configured." }, { status: 500 });
    }

    const client = initiateUserControlledWalletsClient({ apiKey });
    const walletsResponse = await client.listWallets({ userToken });
    const wallets = walletsResponse.data?.wallets ?? [];
    
    let verifiedWalletAddress = wallets.find((w: any) => w.blockchain === "ARC-TESTNET" && w.address)?.address;
    if (!verifiedWalletAddress) {
      verifiedWalletAddress = wallets.find((w: any) => w.address)?.address;
    }

    if (!verifiedWalletAddress) {
      return NextResponse.json({ error: "No wallet found for this user." }, { status: 404 });
    }

    const group = await prisma.group.findUnique({
      where: { contractAddress },
    });

    if (!group) {
      // Group metadata might not be synced yet or it's not managed off-chain
      return NextResponse.json({ error: "Group metadata not found." }, { status: 404 });
    }

    const member = await prisma.member.upsert({
      where: {
        groupId_walletAddress: {
          groupId: group.id,
          walletAddress: verifiedWalletAddress,
        },
      },
      update: {},
      create: {
        groupId: group.id,
        walletAddress: verifiedWalletAddress,
      },
    });

    // Send member joined email to all group members
    try {
      const allMembers = await prisma.member.findMany({
        where: { groupId: group.id, email: { not: null } },
      });

      await Promise.allSettled(
        allMembers.map((m: { walletAddress: string }) =>
          fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              walletAddress: m.walletAddress,
              groupId: group.id,
              type: "MEMBER_JOINED",
              txHash: null,
            }),
          })
        )
      );
    } catch (e) {
      console.warn("Failed to send member joined emails", e);
    }

    return NextResponse.json({ member });
  } catch (error) {
    console.error("POST /api/member/sync error:", error);
    return NextResponse.json({ error: "Failed to sync member." }, { status: 500 });
  }
}
