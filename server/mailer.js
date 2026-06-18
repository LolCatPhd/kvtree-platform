const nodemailer = require('nodemailer');

// Email is configured via SMTP env vars. If they are absent, sendEmail
// becomes a logging no-op so the rest of the workflow still works in dev.
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const MAIL_FROM = process.env.MAIL_FROM || 'KV Tree <no-reply@kvtree.co.za>';

const enabled = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

const transporter = enabled
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    })
  : null;

if (!enabled) {
  console.warn('⚠️  SMTP not configured — emails will be logged, not sent.');
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
  const info = await transporter.sendMail({ from: MAIL_FROM, to, subject, html, text, attachments });
  console.log(`✉️  email sent to ${to}: ${info.messageId}`);
  return info;
}

module.exports = { sendEmail, emailEnabled: enabled };
