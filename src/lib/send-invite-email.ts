import type { BoardMemberRole } from '@/types/board';

type SendBoardInviteEmailInput = {
  to: string;
  boardTitle: string;
  inviterName: string;
  role: BoardMemberRole;
  inviteUrl: string;
};

export type SendBoardInviteEmailResult =
  | { sent: true }
  | { sent: false; reason: 'not_configured' | 'failed'; error?: string };

function roleLabel(role: BoardMemberRole): string {
  return role === 'viewer' ? 'view' : 'edit';
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildInviteEmailHtml(input: SendBoardInviteEmailInput): string {
  const boardTitle = escapeHtml(input.boardTitle);
  const inviterName = escapeHtml(input.inviterName);
  const access = roleLabel(input.role);
  const inviteUrl = escapeHtml(input.inviteUrl);

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f4f4f5;font-family:Arial,sans-serif;color:#18181b;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;">
      <tr>
        <td style="background:#ffffff;border:1px solid #e4e4e7;border-radius:16px;padding:28px;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;color:#71717a;">MoodBoard AI</p>
          <h1 style="margin:0 0 12px;font-size:24px;line-height:1.2;color:#18181b;">You're invited to collaborate</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#52525b;">
            <strong>${inviterName}</strong> invited you to <strong>${access}</strong> the board
            <strong>${boardTitle}</strong>.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${inviteUrl}" style="display:inline-block;background:#18181b;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:999px;font-size:14px;font-weight:600;">
              Accept invitation
            </a>
          </p>
          <p style="margin:0;font-size:13px;line-height:1.6;color:#71717a;">
            If the button does not work, copy this link into your browser:<br />
            <a href="${inviteUrl}" style="color:#52525b;word-break:break-all;">${inviteUrl}</a>
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendBoardInviteEmail(
  input: SendBoardInviteEmailInput,
): Promise<SendBoardInviteEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) {
    return { sent: false, reason: 'not_configured' };
  }

  const boardTitle = input.boardTitle.trim() || 'Untitled board';
  const inviterName = input.inviterName.trim() || 'A collaborator';
  const access = roleLabel(input.role);

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: `${inviterName} invited you to ${access} “${boardTitle}” on MoodBoard AI`,
        html: buildInviteEmailHtml({ ...input, boardTitle, inviterName }),
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      return {
        sent: false,
        reason: 'failed',
        error: detail || `Resend HTTP ${response.status}`,
      };
    }

    return { sent: true };
  } catch (error) {
    return {
      sent: false,
      reason: 'failed',
      error: error instanceof Error ? error.message : 'Failed to send invite email',
    };
  }
}
