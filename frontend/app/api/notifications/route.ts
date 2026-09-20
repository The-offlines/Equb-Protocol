import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/src/lib/prisma';

type NotificationType = 'PAYMENT_CONFIRMED' | 'ROUND_WINNER' | 'PAYMENT_REMINDER' | 'MEMBER_JOINED';
type NotificationStatus = 'PENDING' | 'SENT' | 'FAILED';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { walletAddress, groupId, type, txHash } = await req.json();

    let email: string | null | undefined = null;

    // Look up the user email from the User table using walletAddress
    const user = await prisma.user.findUnique({
      where: { walletAddress },
      select: { email: true }
    });

    if (user?.email) {
      email = user.email;
    }

    // Also check the Member table for email using walletAddress + groupId as fallback
    if (!email && groupId) {
      const member = await prisma.member.findUnique({
        where: {
          groupId_walletAddress: {
            groupId,
            walletAddress
          }
        },
        select: { email: true }
      });
      
      if (member?.email) {
        email = member.email;
      }
    }

    // If no email is found, return a 400 response
    if (!email) {
      return NextResponse.json({ error: "No email found for this wallet" }, { status: 400 });
    }

    let subject = '';
    let body = '';

    switch (type) {
      case 'PAYMENT_CONFIRMED':
        subject = "Payment Confirmed ✅";
        body = "Your contribution has been confirmed on Equb.";
        break;
      case 'ROUND_WINNER':
        subject = "You won this round! 🎉";
        body = "Congratulations! You are the payout winner for this Equb round.";
        break;
      case 'PAYMENT_REMINDER':
        subject = "Payment Reminder ⏰";
        body = "This is a reminder to make your Equb contribution.";
        break;
      case 'MEMBER_JOINED':
        subject = "New Member Joined 👋";
        body = "A new member has joined your Equb group.";
        break;
      default:
        return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
    }

    let sendSuccess = false;

    try {
      const { error } = await resend.emails.send({
        from: 'Equb <onboarding@resend.dev>',
        to: email,
        subject: subject,
        text: body,
      });

      if (!error) {
        sendSuccess = true;
      } else {
        console.error('Failed to send email:', error);
      }
    } catch (e) {
      console.error('Error sending email:', e);
    }

    // After sending, create a Notification record in the database
    const notification = await prisma.notification.create({
      data: {
        walletAddress,
        groupId,
        type: type as NotificationType,
        txHash,
        status: sendSuccess ? 'SENT' : 'FAILED',
        sentAt: sendSuccess ? new Date() : null,
      }
    });

    if (sendSuccess) {
      return NextResponse.json({ success: true, notificationId: notification.id });
    } else {
      // If sending fails, we still created the record with FAILED status, return success: false
      return NextResponse.json({ success: false, notificationId: notification.id, error: 'Failed to send email via Resend' }, { status: 500 });
    }

  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
