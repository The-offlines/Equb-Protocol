import { NextRequest, NextResponse } from "next/server";
import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";
import { prisma } from "@/src/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("[SYNC] Received payload:", body);
    
    const { userToken, contractAddress, inviteCode, name, dagnaWallet, contributionAmount, maxMembers, roundDuration, dueDate } = body;

    if (!userToken || !contractAddress || !inviteCode || !name || !dagnaWallet || !contributionAmount || !maxMembers) {
      console.log("[SYNC] Validation failed: Missing required fields");
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

    console.log("[SYNC] Verified wallet address from Circle:", verifiedWalletAddress);
    console.log("[SYNC] Provided dagnaWallet:", dagnaWallet);

    if (!verifiedWalletAddress || verifiedWalletAddress.toLowerCase() !== dagnaWallet.toLowerCase()) {
      console.log("[SYNC] Validation failed: Wallet mismatch");
      return NextResponse.json({ error: "Unauthorized: Wallet address mismatch." }, { status: 403 });
    }

    console.log("[SYNC] Attempting to upsert group:", { contractAddress, name, inviteCode, dagnaWallet, contributionAmount, maxMembers });
    const group = await prisma.group.upsert({
      where: { contractAddress },
      update: {
        name,
        inviteCode,
        dagnaWallet,
        contributionAmount: Number(contributionAmount),
        maxMembers: Number(maxMembers),
        roundDuration: roundDuration ? Number(roundDuration) : 30,
        dueDate: dueDate ? new Date(dueDate) : null,
        nextDueDate: dueDate ? new Date(new Date(dueDate).getTime() + (roundDuration ? Number(roundDuration) : 30) * 24 * 60 * 60 * 1000) : null,
      },
      create: {
        contractAddress,
        inviteCode,
        name,
        dagnaWallet,
        contributionAmount: Number(contributionAmount),
        maxMembers: Number(maxMembers),
        roundDuration: roundDuration ? Number(roundDuration) : 30,
        dueDate: dueDate ? new Date(dueDate) : null,
        nextDueDate: dueDate ? new Date(new Date(dueDate).getTime() + (roundDuration ? Number(roundDuration) : 30) * 24 * 60 * 60 * 1000) : null,
      },
    });
    console.log("[SYNC] Group upserted successfully:", group);

    // Also sync the dagna as a member of the group
    console.log("[SYNC] Attempting to upsert dagna member");
    await prisma.member.upsert({
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
    console.log("[SYNC] Dagna member upserted successfully");

    // Send group created email to the creator
    try {
      const creator = await prisma.user.findUnique({
        where: { walletAddress: verifiedWalletAddress },
      });

      if (creator?.email) {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress: verifiedWalletAddress,
            groupId: group.id,
            type: 'PAYMENT_REMINDER',
            txHash: null,
            metadata: {
              subject: `Your Equb Group "${group.name}" Has Been Created! 🎉`,
              message: `Your Equb savings group "<strong>${group.name}</strong>" has been created successfully on the Arc Testnet.<br/><br/>
              <strong>Group Details:</strong><br/>
              • Contribution Amount: <strong>${group.contributionAmount} ARC</strong><br/>
              • Max Members: <strong>${group.maxMembers}</strong><br/>
              • Invite Code: <strong>${group.inviteCode}</strong><br/><br/>
              Share your invite code with members to get started!`,
              groupName: group.name,
            },
          }),
        });
      }
    } catch (e) {
      console.warn('Failed to send group created email', e);
    }

    return NextResponse.json({ group });
  } catch (error) {
    console.error("POST /api/groups/sync error:", error);
    return NextResponse.json({ error: "Failed to sync group." }, { status: 500 });
  }
}
