const fs = require('fs');
const nodemailer = require('nodemailer');

// Email can be sent two ways, picked in this order:
//   1. Resend HTTPS API (RESEND_API_KEY) — works on hosts that block SMTP
//      egress (e.g. Railway, which refuses outbound 587/465).
//   2. SMTP (SMTP_HOST/USER/PASS) — classic transport for hosts that allow it.
//   3. Neither configured → sendEmail becomes a logging no-op so the rest of
//      the workflow still works in dev.
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM || 'KV Tree <no-reply@kvtree.co.za>';

const resendEnabled = Boolean(RESEND_API_KEY);
const smtpEnabled = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);
const enabled = resendEnabled || smtpEnabled;

const transporter = smtpEnabled
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      // Fail fast instead of hanging if the SMTP host/credentials are wrong.
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    })
  : null;

if (resendEnabled) {
  console.log('✉️  Email transport: Resend API');
} else if (smtpEnabled) {
  console.log('✉️  Email transport: SMTP');
} else {
  console.warn('⚠️  Email not configured — emails will be logged, not sent.');
}

// Turn nodemailer-style attachments ([{ filename, path }] or
// [{ filename, content }]) into Resend's format ([{ filename, content }] where
// content is a base64 string).
function toResendAttachments(attachments) {
  if (!attachments || !attachments.length) return undefined;
  return attachments.map((a) => {
    let buf;
    if (a.content != null) {
      buf = Buffer.isBuffer(a.content) ? a.content : Buffer.from(a.content);
    } else if (a.path) {
      buf = fs.readFileSync(a.path);
    } else {
      buf = Buffer.alloc(0);
    }
    return { filename: a.filename, content: buf.toString('base64') };
  });
}

async function sendViaResend({ to, subject, html, text, attachments }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: MAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      attachments: toResendAttachments(attachments),
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend API ${res.status}: ${detail}`);
  }
  const data = await res.json().catch(() => ({}));
  console.log(`✉️  email sent to ${to}: ${data.id || '(no id)'}`);
  return data;
}

/**
 * Send an email. Attachments follow nodemailer's format:
 * [{ filename, path }] or [{ filename, content }].
 */
async function sendEmail({ to, subject, html, text, attachments }) {
  if (!enabled) {
    console.log(`✉️  [email skipped] to=${to} subject="${subject}"`);
    return { skipped: true };
  }
  if (resendEnabled) {
    return sendViaResend({ to, subject, html, text, attachments });
  }
  const info = await transporter.sendMail({ from: MAIL_FROM, to, subject, html, text, attachments });
  console.log(`✉️  email sent to ${to}: ${info.messageId}`);
  return info;
}

module.exports = { sendEmail, emailEnabled: enabled };
