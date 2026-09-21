import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/src/lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL ?? 'onboarding@resend.dev';

type NotificationType = 'PAYMENT_CONFIRMED' | 'ROUND_WINNER' | 'PAYMENT_REMINDER' | 'MEMBER_JOINED';

function getEmailContent(type: NotificationType, metadata?: Record<string, string | number | null>): { subject: string; html: string } {
  const groupName = metadata?.groupName ?? 'your Equb group';
  const contributionAmount = metadata?.contributionAmount ?? '';
  const paidBy = metadata?.paidBy ?? '';
  const invitedBy = metadata?.invitedBy ?? '';
  const inviteeAddress = metadata?.inviteeAddress ?? '';
  const removedBy = metadata?.removedBy ?? '';
  const removedMember = metadata?.removedMember ?? '';
  const dueDate = metadata?.dueDate ?? '';
  const txHash = metadata?.txHash ?? '';
  const maxMembers = metadata?.maxMembers ?? '';

  // Allow full override from metadata
  if (metadata?.subject && metadata?.message) {
    return {
      subject: String(metadata.subject),
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1a1a2e;">${metadata.subject}</h2>
          <p style="color: #333; font-size: 16px;">${metadata.message}</p>
          ${txHash ? `<p style="color: #666; font-size: 13px;">Transaction: <code>${txHash}</code></p>` : ''}
          <hr style="border: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #999; font-size: 12px;">This is an automated message from Equb. If you did not expect this email, please ignore it.</p>
        </div>
      `,
    };
  }

  switch (type) {
    case 'PAYMENT_CONFIRMED':
      if (paidBy) {
        return {
          subject: `Member Payment Update 💰 — ${groupName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1a1a2e;">Payment Update for ${groupName}</h2>
              <p style="color: #333; font-size: 16px;">Member <strong>${paidBy}</strong> has paid <strong>${contributionAmount} ARC</strong> to your Equb group <strong>${groupName}</strong>.</p>
              ${txHash ? `<p style="color: #666; font-size: 13px;">Transaction: <code>${txHash}</code></p>` : ''}
              <hr style="border: 1px solid #eee; margin: 20px 0;" />
              <p style="color: #999; font-size: 12px;">This is an automated message from Equb.</p>
            </div>
          `,
        };
      }
      return {
        subject: `Payment Confirmed ✅ — ${groupName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a2e;">Payment Confirmed!</h2>
            <p style="color: #333; font-size: 16px;">You have successfully paid <strong>${contributionAmount} ARC</strong> to the Equb group <strong>${groupName}</strong>.</p>
            ${txHash ? `<p style="color: #666; font-size: 13px;">Transaction: <code>${txHash}</code></p>` : ''}
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px;">This is an automated message from Equb.</p>
          </div>
        `,
      };

    case 'ROUND_WINNER':
      return {
        subject: `You Won This Round! 🎉 — ${groupName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a2e;">Congratulations! 🎉</h2>
            <p style="color: #333; font-size: 16px;">You are the payout winner for this round in <strong>${groupName}</strong>!</p>
            <p style="color: #333; font-size: 16px;">The funds have been sent to your wallet on the Arc Testnet.</p>
            ${txHash ? `<p style="color: #666; font-size: 13px;">Transaction: <code>${txHash}</code></p>` : ''}
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px;">This is an automated message from Equb.</p>
          </div>
        `,
      };

    case 'MEMBER_JOINED':
      if (invitedBy) {
        return {
          subject: `You Have Been Invited to ${groupName} 👋`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1a1a2e;">You Have Been Invited!</h2>
              <p style="color: #333; font-size: 16px;">Wallet <strong>${invitedBy}</strong> has invited you to join the Equb group <strong>${groupName}</strong>.</p>
              ${contributionAmount ? `<p style="color: #333; font-size: 16px;">Contribution amount: <strong>${contributionAmount} ARC</strong></p>` : ''}
              ${maxMembers ? `<p style="color: #333; font-size: 16px;">Group size: <strong>${maxMembers} members</strong></p>` : ''}
              <p style="color: #333; font-size: 16px;">Open your Equb app to accept the invitation.</p>
              <hr style="border: 1px solid #eee; margin: 20px 0;" />
              <p style="color: #999; font-size: 12px;">This is an automated message from Equb. If you did not expect this, please ignore it.</p>
            </div>
          `,
        };
      }
      if (inviteeAddress) {
        return {
          subject: `You Invited a New Member to ${groupName} ✅`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1a1a2e;">Invite Sent Successfully!</h2>
              <p style="color: #333; font-size: 16px;">You have successfully invited <strong>${inviteeAddress}</strong> to your Equb group <strong>${groupName}</strong>.</p>
              <hr style="border: 1px solid #eee; margin: 20px 0;" />
              <p style="color: #999; font-size: 12px;">This is an automated message from Equb.</p>
            </div>
          `,
        };
      }
      if (removedMember) {
        return {
          subject: `Member Removed from ${groupName} 🔔`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #1a1a2e;">Member Removed</h2>
              <p style="color: #333; font-size: 16px;">Member <strong>${removedMember}</strong> has been removed from your Equb group <strong>${groupName}</strong> by the creator.</p>
              <hr style="border: 1px solid #eee; margin: 20px 0;" />
              <p style="color: #999; font-size: 12px;">This is an automated message from Equb.</p>
            </div>
          `,
        };
      }
      return {
        subject: `New Member Joined ${groupName} 👋`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a2e;">New Member Joined!</h2>
            <p style="color: #333; font-size: 16px;">A new member has joined your Equb group <strong>${groupName}</strong>.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px;">This is an automated message from Equb.</p>
          </div>
        `,
      };

    case 'PAYMENT_REMINDER':
      return {
        subject: `Payment Reminder ⏰ — ${groupName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #1a1a2e;">Payment Reminder</h2>
            <p style="color: #333; font-size: 16px;">Your contribution of <strong>${contributionAmount} ARC</strong> to <strong>${groupName}</strong> is due soon.</p>
            ${dueDate ? `<p style="color: #333; font-size: 16px;">Due date: <strong>${dueDate}</strong></p>` : ''}
            <p style="color: #333; font-size: 16px;">Please make your payment on time to keep your Equb group running smoothly.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            <p style="color: #999; font-size: 12px;">This is an automated message from Equb.</p>
          </div>
        `,
      };

    default:
      return {
        subject: 'Equb Notification',
        html: '<p>You have a new notification from Equb.</p>',
      };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { walletAddress, groupId, type, txHash, metadata } = await req.json() as {
      walletAddress: string;
      groupId: string | null;
      type: NotificationType;
      txHash: string | null;
      metadata?: Record<string, string | number | null>;
    };

    if (!walletAddress || !type) {
      return NextResponse.json({ error: 'walletAddress and type are required' }, { status: 400 });
    }

    // Handle group-wide notifications (walletAddress starts with "group:")
    if (walletAddress.startsWith('group:')) {
      const gId = walletAddress.replace('group:', '');
      const members = await prisma.member.findMany({
        where: { groupId: gId, email: { not: null } },
      });

      const results = await Promise.allSettled(
        members.map(async (member: { email: string | null; walletAddress: string }) => {
          const emailContent = getEmailContent(type, { ...metadata, txHash });
          await resend.emails.send({
            from: FROM_EMAIL,
            to: member.email!,
            subject: emailContent.subject,
            html: emailContent.html,
          });
          await prisma.notification.create({
            data: {
              walletAddress: member.walletAddress,
              groupId: gId,
              type,
              status: 'SENT',
              sentAt: new Date(),
              txHash: txHash ?? null,
            },
          });
        })
      );

      const sent = results.filter((r) => r.status === 'fulfilled').length;
      return NextResponse.json({ success: true, sent });
    }

    // Single user notification
    let email: string | null = null;

    const user = await prisma.user.findUnique({
      where: { walletAddress },
      select: { email: true },
    });
    email = user?.email ?? null;

    if (!email && groupId) {
      const member = await prisma.member.findFirst({
        where: { walletAddress, groupId },
        select: { email: true },
      });
      email = member?.email ?? null;
    }

    if (!email) {
      return NextResponse.json({ error: 'No email found for this wallet' }, { status: 400 });
    }

    const emailContent = getEmailContent(type, { ...metadata, txHash });

    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
      });

      const notification = await prisma.notification.create({
        data: {
          walletAddress,
          groupId: groupId ?? null,
          type,
          status: 'SENT',
          sentAt: new Date(),
          txHash: txHash ?? null,
        },
      });

      return NextResponse.json({ success: true, notificationId: notification.id });
    } catch {
      const notification = await prisma.notification.create({
        data: {
          walletAddress,
          groupId: groupId ?? null,
          type,
          status: 'FAILED',
          txHash: txHash ?? null,
        },
      });

      return NextResponse.json({ error: 'Failed to send email', notificationId: notification.id }, { status: 500 });
    }
  } catch (error) {
    console.error('API Route Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
