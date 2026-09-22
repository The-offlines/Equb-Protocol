import { NextRequest, NextResponse } from "next/server";
import { initiateUserControlledWalletsClient } from "@circle-fin/user-controlled-wallets";
import { prisma } from "@/src/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const userToken = request.headers.get("x-user-token") || request.headers.get("authorization")?.replace("Bearer ", "");
    if (!userToken) {
      return NextResponse.json({ error: "Missing user token." }, { status: 401 });
    }

    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Circle API key is not configured." }, { status: 500 });
    }

    const client = initiateUserControlledWalletsClient({ apiKey });
    const walletsResponse = await client.listWallets({ userToken });
    const wallets = walletsResponse.data?.wallets ?? [];
    
    // First priority: ARC-TESTNET wallet
    let walletAddress = wallets.find((w: any) => w.blockchain === "ARC-TESTNET" && w.address)?.address;
    if (!walletAddress) {
      walletAddress = wallets.find((w: any) => w.address)?.address;
    }

    if (!walletAddress) {
      return NextResponse.json({ error: "No wallet found for this user." }, { status: 404 });
    }

    const user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ error: "Failed to fetch profile." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userToken, email } = body;

    if (!userToken) {
      return NextResponse.json({ error: "Missing user token." }, { status: 400 });
    }

    const apiKey = process.env.CIRCLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Circle API key is not configured." }, { status: 500 });
    }

    const client = initiateUserControlledWalletsClient({ apiKey });
    const walletsResponse = await client.listWallets({ userToken });
    const wallets = walletsResponse.data?.wallets ?? [];
    
    // First priority: ARC-TESTNET wallet
    let walletAddress = wallets.find((w: any) => w.blockchain === "ARC-TESTNET" && w.address)?.address;
    if (!walletAddress) {
      walletAddress = wallets.find((w: any) => w.address)?.address;
    }

    if (!walletAddress) {
      return NextResponse.json({ error: "No wallet found for this user." }, { status: 404 });
    }

    const user = await prisma.user.upsert({
      where: { walletAddress },
      update: {
        email: email || undefined,
      },
      create: {
        walletAddress,
        email: email || undefined,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("POST /api/profile error:", error);
    return NextResponse.json({ error: "Failed to sync profile." }, { status: 500 });
  }
}
