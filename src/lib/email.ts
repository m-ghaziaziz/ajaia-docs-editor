import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
});

export async function sendMagicLinkEmail(email: string, token: string): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const link = `${appUrl}/auth/verify?token=${encodeURIComponent(token)}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sign in to Ajaia Docs</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;min-height:100vh;">
    <tr>
      <td align="center" style="padding:48px 16px;">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#13131a;border-radius:16px;border:1px solid #2a2a3d;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6c47ff,#a855f7);padding:40px 40px 32px;text-align:center;">
              <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;">
                ✦ Ajaia Docs
              </div>
              <div style="color:rgba(255,255,255,0.8);font-size:14px;margin-top:6px;">
                Your collaborative writing platform
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 12px;color:#f4f4f8;font-size:22px;font-weight:700;">
                Sign in to your account
              </h2>
              <p style="margin:0 0 28px;color:#9999b3;font-size:15px;line-height:1.6;">
                Click the button below to securely sign in. This link will expire in <strong style="color:#a855f7;">15 minutes</strong> and can only be used once.
              </p>
              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:4px 0 32px;">
                    <a href="${link}"
                      style="display:inline-block;background:linear-gradient(135deg,#6c47ff,#a855f7);color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:16px 40px;border-radius:10px;letter-spacing:0.3px;">
                      Sign In to Ajaia Docs →
                    </a>
                  </td>
                </tr>
              </table>
              <!-- Link fallback -->
              <div style="background:#0a0a0f;border-radius:8px;padding:16px;margin-bottom:24px;">
                <p style="margin:0 0 8px;color:#9999b3;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">
                  Or copy this link
                </p>
                <p style="margin:0;color:#6c47ff;font-size:13px;word-break:break-all;">${link}</p>
              </div>
              <!-- Warning -->
              <p style="margin:0;color:#666680;font-size:13px;line-height:1.5;">
                🔒 If you didn't request this link, you can safely ignore this email. Someone may have entered your email address by mistake.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #2a2a3d;">
              <p style="margin:0;color:#444460;font-size:12px;text-align:center;">
                Ajaia Docs · Sent to ${email}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'Ajaia Docs <noreply@example.com>',
    to: email,
    subject: '✦ Your Ajaia Docs sign-in link',
    html,
    text: `Sign in to Ajaia Docs\n\nClick this link to sign in (expires in 15 minutes):\n${link}\n\nIf you didn't request this, ignore this email.`,
  });
}
