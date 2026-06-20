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

// Convert a phone number to E.164 (e.g. "083 654 8048" -> "+27836548048").
// Twilio rejects local formats. Defaults to South Africa (+27); override with
// DEFAULT_COUNTRY_CODE.
function toE164(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  if (s.startsWith('whatsapp:')) s = s.slice('whatsapp:'.length).trim();
  if (s.startsWith('+')) return '+' + s.slice(1).replace(/\D/g, '');
  s = s.replace(/\D/g, '');
  if (!s) return null;
  const cc = (process.env.DEFAULT_COUNTRY_CODE || '27').replace(/\D/g, '');
  if (s.startsWith('0')) return `+${cc}${s.slice(1)}`; // local "0xx" -> "+CCxx"
  if (s.startsWith(cc)) return `+${s}`; // already has country code, no plus
  if (s.length <= 9) return `+${cc}${s}`; // local number without leading 0
  return `+${s}`;
}

function normalize(number) {
  const e164 = toE164(number);
  return e164 ? `whatsapp:${e164}` : null;
}

async function sendWhatsApp({ to, body, mediaUrl }) {
  const dest = normalize(to);
  if (!enabled || !dest) {
    console.log(`📱 [whatsapp skipped] to=${to} body="${body?.slice(0, 60)}..."`);
    return { skipped: true };
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`;
  const params = new URLSearchParams({ From: FROM, To: dest, Body: body });
  // Attach a document/image (e.g. the quote/invoice PDF). Twilio fetches the
  // URL server-side, so it must be publicly reachable (our /files links are).
  if (mediaUrl) params.append('MediaUrl', mediaUrl);
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
