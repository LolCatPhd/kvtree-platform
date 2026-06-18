// WhatsApp notifications via the Twilio API. Fully functional once the
// TWILIO_* env vars are set; otherwise sendWhatsApp logs and returns.
//
// Env:
//   TWILIO_ACCOUNT_SID
//   TWILIO_AUTH_TOKEN
//   TWILIO_WHATSAPP_FROM   e.g. "whatsapp:+14155238886"
const SID = process.env.TWILIO_ACCOUNT_SID;
const TOKEN = process.env.TWILIO_AUTH_TOKEN;
const FROM = process.env.TWILIO_WHATSAPP_FROM;

const enabled = Boolean(SID && TOKEN && FROM);

if (!enabled) {
  console.warn('⚠️  Twilio WhatsApp not configured — WhatsApp messages will be logged, not sent.');
}

function normalize(number) {
  if (!number) return null;
  const trimmed = String(number).trim();
  return trimmed.startsWith('whatsapp:') ? trimmed : `whatsapp:${trimmed}`;
}

async function sendWhatsApp({ to, body }) {
  const dest = normalize(to);
  if (!enabled || !dest) {
    console.log(`📱 [whatsapp skipped] to=${to} body="${body?.slice(0, 60)}..."`);
    return { skipped: true };
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`;
  const params = new URLSearchParams({ From: FROM, To: dest, Body: body });
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${SID}:${TOKEN}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Twilio error ${res.status}: ${detail}`);
  }
  const data = await res.json();
  console.log(`📱 whatsapp sent to ${to}: ${data.sid}`);
  return data;
}

module.exports = { sendWhatsApp, whatsappEnabled: enabled };
