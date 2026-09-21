import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { prisma } from '@/src/lib/prisma';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL ?? 'onboarding@resend.dev';

type NotificationType = 'PAYMENT_CONFIRMED' | 'ROUND_WINNER' | 'PAYMENT_REMINDER' | 'MEMBER_JOINED';

function emailWrapper(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#0f0f1a;font-family:'Helvetica Neue',Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f0f1a;padding:40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
              
              <!-- Header -->
              <tr>
                <td style="background:linear-gradient(135deg,#1a1a2e 0%,#16213e 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;border-bottom:2px solid #6c63ff;">
                  <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:2px;">⬡ EQUB</h1>
                  <p style="margin:6px 0 0;color:#8b8fa8;font-size:13px;letter-spacing:1px;">DECENTRALIZED SAVINGS PROTOCOL</p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="background:#1a1a2e;padding:40px;">
                  ${content}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background:#13131f;border-radius:0 0 16px 16px;padding:24px 40px;text-align:center;border-top:1px solid #2a2a3e;">
                  <p style="margin:0;color:#8b8fa8;font-size:12px;">Equb Protocol · Arc Testnet</p>
                  <p style="margin:8px 0 0;color:#8b8fa8;font-size:11px;">This is an automated message. If you did not expect this email, please ignore it.</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

function badge(text: string, color: string): string {
  return `<span style="display:inline-block;background:${color}22;color:${color};border:1px solid ${color}44;border-radius:20px;padding:4px 14px;font-size:12px;font-weight:600;letter-spacing:1px;">${text}</span>`;
}

function infoRow(label: string, value: string): string {
  return `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #2a2a3e;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="color:#8b8fa8;font-size:13px;">${label}</td>
            <td align="right" style="color:#ffffff;font-size:13px;font-weight:600;">${value}</td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function getEmailContent(type: NotificationType, metadata?: Record<string, string | number | null>): { subject: string; html: string } {
  const groupName = String(metadata?.groupName ?? 'your Equb group');
  const contributionAmount = metadata?.contributionAmount ?? '';
  const paidBy = String(metadata?.paidBy ?? '');
  const invitedBy = String(metadata?.invitedBy ?? '');
  const inviteeAddress = String(metadata?.inviteeAddress ?? '');
  const removedBy = String(metadata?.removedBy ?? '');
  const removedMember = String(metadata?.removedMember ?? '');
  const dueDate = String(metadata?.dueDate ?? '');
  const txHash = String(metadata?.txHash ?? '');
  const maxMembers = metadata?.maxMembers ?? '';

  // Allow full override from metadata
  if (metadata?.subject && metadata?.message) {
    return {
      subject: String(metadata.subject),
      html: emailWrapper(`
        <h2 style="margin:0 0 8px;color:#ffffff;font-size:22px;font-weight:700;">${metadata.subject}</h2>
        <p style="margin:0 0 24px;color:#6c63ff;font-size:14px;">${groupName}</p>
        <p style="color:#c0c4d6;font-size:15px;line-height:1.7;">${String(metadata.message).replace(/\n/g, '<br/>')}</p>
        ${txHash ? `
        <div style="margin-top:24px;background:#0f0f1a;border-radius:8px;padding:16px;border:1px solid #2a2a3e;">
          <p style="margin:0;color:#8b8fa8;font-size:11px;letter-spacing:1px;">TRANSACTION HASH</p>
          <p style="margin:6px 0 0;color:#6c63ff;font-size:12px;word-break:break-all;font-family:monospace;">${txHash}</p>
        </div>` : ''}
      `),
    };
  }

  switch (type) {
    case 'PAYMENT_CONFIRMED':
      if (paidBy) {
        return {
          subject: `Payment Update — ${groupName}`,
          html: emailWrapper(`
            <div style="text-align:center;margin-bottom:32px;">
              ${badge('PAYMENT UPDATE', '#f59e0b')}
              <h2 style="margin:16px 0 8px;color:#ffffff;font-size:24px;font-weight:700;">New Payment Received 💰</h2>
              <p style="margin:0;color:#8b8fa8;font-size:14px;">A member has made their contribution</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              ${infoRow('Group', groupName)}
              ${infoRow('Paid By', paidBy.slice(0, 6) + '...' + paidBy.slice(-4))}
              ${contributionAmount ? infoRow('Amount', `${contributionAmount} ARC`) : ''}
              ${txHash ? infoRow('Transaction', txHash.slice(0, 10) + '...' + txHash.slice(-8)) : ''}
            </table>
            ${txHash ? `
            <div style="background:#0f0f1a;border-radius:8px;padding:16px;border:1px solid #2a2a3e;">
              <p style="margin:0;color:#8b8fa8;font-size:11px;letter-spacing:1px;">FULL TRANSACTION HASH</p>
              <p style="margin:6px 0 0;color:#6c63ff;font-size:12px;word-break:break-all;font-family:monospace;">${txHash}</p>
            </div>` : ''}
          `),
        };
      }
      return {
        subject: `Payment Confirmed ✅ — ${groupName}`,
        html: emailWrapper(`
          <div style="text-align:center;margin-bottom:32px;">
            ${badge('PAYMENT CONFIRMED', '#10b981')}
            <h2 style="margin:16px 0 8px;color:#ffffff;font-size:24px;font-weight:700;">Payment Successful! ✅</h2>
            <p style="margin:0;color:#8b8fa8;font-size:14px;">Your contribution has been recorded on-chain</p>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            ${infoRow('Group', groupName)}
            ${contributionAmount ? infoRow('Amount Paid', `${contributionAmount} ARC`) : ''}
            ${infoRow('Network', 'Arc Testnet')}
            ${infoRow('Status', '✅ Confirmed')}
          </table>
          ${txHash ? `
          <div style="background:#0f0f1a;border-radius:8px;padding:16px;border:1px solid #2a2a3e;">
            <p style="margin:0;color:#8b8fa8;font-size:11px;letter-spacing:1px;">TRANSACTION HASH</p>
            <p style="margin:6px 0 0;color:#6c63ff;font-size:12px;word-break:break-all;font-family:monospace;">${txHash}</p>
          </div>` : ''}
        `),
      };

    case 'ROUND_WINNER':
      return {
        subject: `You Won This Round! 🎉 — ${groupName}`,
        html: emailWrapper(`
          <div style="text-align:center;margin-bottom:32px;">
            ${badge('ROUND WINNER', '#6c63ff')}
            <h2 style="margin:16px 0 8px;color:#ffffff;font-size:24px;font-weight:700;">Congratulations! 🎉</h2>
            <p style="margin:0;color:#8b8fa8;font-size:14px;">You have been selected as this round's payout winner</p>
          </div>
          <div style="background:linear-gradient(135deg,#6c63ff22,#10b98122);border:1px solid #6c63ff44;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
            <p style="margin:0;color:#c0c4d6;font-size:15px;">The full payout for <strong style="color:#ffffff;">${groupName}</strong> has been sent to your wallet on the Arc Testnet.</p>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${infoRow('Group', groupName)}
            ${infoRow('Network', 'Arc Testnet')}
            ${infoRow('Status', '✅ Funds Distributed')}
            ${txHash ? infoRow('Transaction', txHash.slice(0, 10) + '...' + txHash.slice(-8)) : ''}
          </table>
        `),
      };

    case 'MEMBER_JOINED':
      if (invitedBy) {
        return {
          subject: `You Have Been Invited to ${groupName} 👋`,
          html: emailWrapper(`
            <div style="text-align:center;margin-bottom:32px;">
              ${badge('INVITATION', '#f59e0b')}
              <h2 style="margin:16px 0 8px;color:#ffffff;font-size:24px;font-weight:700;">You Have Been Invited! 👋</h2>
              <p style="margin:0;color:#8b8fa8;font-size:14px;">Someone wants you to join their Equb group</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
              ${infoRow('Group', groupName)}
              ${infoRow('Invited By', invitedBy.slice(0, 6) + '...' + invitedBy.slice(-4))}
              ${contributionAmount ? infoRow('Contribution', `${contributionAmount} ARC`) : ''}
              ${maxMembers ? infoRow('Group Size', `${maxMembers} members`) : ''}
              ${infoRow('Network', 'Arc Testnet')}
            </table>
            <div style="background:#0f0f1a;border-radius:8px;padding:16px;border:1px solid #2a2a3e;text-align:center;">
              <p style="margin:0;color:#8b8fa8;font-size:13px;">Open your Equb app to accept the invitation and join the group.</p>
            </div>
          `),
        };
      }
      if (inviteeAddress) {
        return {
          subject: `Invite Sent to ${inviteeAddress.includes('@') ? inviteeAddress : inviteeAddress.slice(0, 6) + '...' + inviteeAddress.slice(-4)} ✅`,
          html: emailWrapper(`
            <div style="text-align:center;margin-bottom:32px;">
              ${badge('INVITE SENT', '#10b981')}
              <h2 style="margin:16px 0 8px;color:#ffffff;font-size:24px;font-weight:700;">Invite Sent Successfully! ✅</h2>
              <p style="margin:0;color:#8b8fa8;font-size:14px;">Your invitation has been recorded on-chain</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${infoRow('Group', groupName)}
              ${infoRow('Invited', inviteeAddress.includes('@') ? inviteeAddress : inviteeAddress.slice(0, 6) + '...' + inviteeAddress.slice(-4))}
              ${infoRow('Status', '✅ On-chain Confirmed')}
            </table>
          `),
        };
      }
      if (removedMember) {
        return {
          subject: `Member Removed from ${groupName} 🔔`,
          html: emailWrapper(`
            <div style="text-align:center;margin-bottom:32px;">
              ${badge('MEMBER REMOVED', '#ef4444')}
              <h2 style="margin:16px 0 8px;color:#ffffff;font-size:24px;font-weight:700;">Member Removed 🔔</h2>
              <p style="margin:0;color:#8b8fa8;font-size:14px;">A member has been removed from your group</p>
            </div>
            <table width="100%" cellpadding="0" cellspacing="0">
              ${infoRow('Group', groupName)}
              ${infoRow('Removed Member', removedMember.slice(0, 6) + '...' + removedMember.slice(-4))}
              ${removedBy ? infoRow('Removed By', removedBy.slice(0, 6) + '...' + removedBy.slice(-4)) : ''}
            </table>
          `),
        };
      }
      return {
        subject: `New Member Joined ${groupName} 👋`,
        html: emailWrapper(`
          <div style="text-align:center;margin-bottom:32px;">
            ${badge('NEW MEMBER', '#6c63ff')}
            <h2 style="margin:16px 0 8px;color:#ffffff;font-size:24px;font-weight:700;">New Member Joined! 👋</h2>
            <p style="margin:0;color:#8b8fa8;font-size:14px;">Your Equb group is growing</p>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0">
            ${infoRow('Group', groupName)}
            ${infoRow('Network', 'Arc Testnet')}
          </table>
        `),
      };

    case 'PAYMENT_REMINDER':
      return {
        subject: `Payment Reminder ⏰ — ${groupName}`,
        html: emailWrapper(`
          <div style="text-align:center;margin-bottom:32px;">
            ${badge('REMINDER', '#f59e0b')}
            <h2 style="margin:16px 0 8px;color:#ffffff;font-size:24px;font-weight:700;">Payment Due Soon ⏰</h2>
            <p style="margin:0;color:#8b8fa8;font-size:14px;">Don't miss your contribution deadline</p>
          </div>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            ${infoRow('Group', groupName)}
            ${contributionAmount ? infoRow('Amount Due', `${contributionAmount} ARC`) : ''}
            ${dueDate ? infoRow('Due Date', new Date(dueDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })) : ''}
            ${infoRow('Network', 'Arc Testnet')}
          </table>
          <div style="background:#f59e0b11;border:1px solid #f59e0b44;border-radius:8px;padding:16px;text-align:center;">
            <p style="margin:0;color:#f59e0b;font-size:13px;font-weight:600;">Please make your payment on time to keep your Equb group running smoothly.</p>
          </div>
        `),
      };

    default:
      return {
        subject: 'Equb Notification',
        html: emailWrapper(`<p style="color:#c0c4d6;">You have a new notification from Equb Protocol.</p>`),
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
        where: { groupId: gId },
      });

      const users = await prisma.user.findMany({
        where: { 
          walletAddress: { in: members.map((m: { walletAddress: string }) => m.walletAddress.toLowerCase()) },
          email: { not: null } 
        },
      });

      const results = await Promise.allSettled(
        users.map(async (u: { email: string | null; walletAddress: string }) => {
          const emailContent = getEmailContent(type, { ...metadata, txHash });
          const res = await resend.emails.send({
            from: FROM_EMAIL,
            to: u.email!,
            subject: emailContent.subject,
            html: emailContent.html,
          });
          
          if (res.error) {
            console.error('[Resend Error]:', res.error);
            await prisma.notification.create({
              data: {
                walletAddress: u.walletAddress,
                groupId: gId,
                type,
                status: 'FAILED',
                sentAt: null,
                txHash: txHash ?? null,
              },
            });
            throw new Error(res.error.message);
          }

          await prisma.notification.create({
            data: {
              walletAddress: u.walletAddress,
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

    const user = await prisma.user.findFirst({
      where: { 
        walletAddress: { equals: walletAddress, mode: 'insensitive' }
      },
      select: { email: true },
    });
    email = user?.email ?? null;

    if (!email && groupId) {
      const member = await prisma.member.findFirst({
        where: { 
          walletAddress: { equals: walletAddress, mode: 'insensitive' },
          groupId 
        },
        select: { email: true },
      });
      email = member?.email ?? null;
    }

    if (!email) {
      return NextResponse.json({ error: 'No email found for this wallet' }, { status: 400 });
    }

    const emailContent = getEmailContent(type, { ...metadata, txHash });

    try {
      const res = await resend.emails.send({
        from: FROM_EMAIL,
        to: email,
        subject: emailContent.subject,
        html: emailContent.html,
      });

      if (res.error) {
        console.error('[Resend Error]:', res.error);
        const notification = await prisma.notification.create({
          data: {
            walletAddress,
            groupId: groupId ?? null,
            type,
            status: 'FAILED',
            txHash: txHash ?? null,
          },
        });
        return NextResponse.json({ error: res.error.message, notificationId: notification.id }, { status: 500 });
      }

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
