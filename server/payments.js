// PayFast payment integration (the standard South African gateway).
// Fully functional once the PAYFAST_* env vars are set; otherwise `enabled`
// is false and the API returns a clear "payments not configured" error.
//
// Env:
//   PAYFAST_MERCHANT_ID
//   PAYFAST_MERCHANT_KEY
//   PAYFAST_PASSPHRASE      (optional but recommended)
//   PAYFAST_SANDBOX=true    (default true; set "false" for live)
const crypto = require('crypto');

const MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID;
const MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY;
const PASSPHRASE = process.env.PAYFAST_PASSPHRASE || '';
const SANDBOX = process.env.PAYFAST_SANDBOX !== 'false';

const enabled = Boolean(MERCHANT_ID && MERCHANT_KEY);
const PROCESS_URL = SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process';
const VALIDATE_URL = SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/query/validate'
  : 'https://www.payfast.co.za/eng/query/validate';

if (!enabled) {
  console.warn('⚠️  PayFast not configured — online payments are disabled.');
}

// PayFast urlencodes values with spaces as "+" and uppercase hex.
const pfEncode = (v) => encodeURIComponent(String(v).trim()).replace(/%20/g, '+').replace(/[a-f0-9]{2}/g, (m) => m.toUpperCase());

// Build the MD5 signature over the fields in insertion order (PayFast spec).
function signature(data, passphrase) {
  let out = '';
  for (const key of Object.keys(data)) {
    if (key === 'signature') continue;
    if (data[key] !== '' && data[key] != null) {
      out += `${key}=${pfEncode(data[key])}&`;
    }
  }
  out = out.slice(0, -1);
  if (passphrase) out += `&passphrase=${pfEncode(passphrase)}`;
  return crypto.createHash('md5').update(out).digest('hex');
}

// Build the form fields + process URL the client posts to PayFast.
function buildPayment({ invoice, lead, returnUrl, cancelUrl, notifyUrl }) {
  const data = {
    merchant_id: MERCHANT_ID,
    merchant_key: MERCHANT_KEY,
    return_url: returnUrl,
    cancel_url: cancelUrl,
    notify_url: notifyUrl,
    name_first: (lead?.name || 'Customer').split(' ')[0],
    email_address: lead?.email || '',
    m_payment_id: String(invoice.id),
    amount: Number(invoice.amount).toFixed(2),
    item_name: `KV Tree Invoice #${invoice.id}`,
  };
  data.signature = signature(data, PASSPHRASE);
  return { processUrl: PROCESS_URL, fields: data };
}

// Verify an ITN (Instant Transaction Notification) callback signature.
function verifySignature(body) {
  const calc = signature(body, PASSPHRASE);
  return calc === body.signature;
}

// Server-to-server confirmation that the ITN really came from PayFast.
async function validateWithPayfast(rawBody) {
  try {
    const res = await fetch(VALIDATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: rawBody,
    });
    const text = await res.text();
    return text.trim().split('\n')[0].trim() === 'VALID';
  } catch (err) {
    console.error('PayFast validation error:', err.message);
    return false;
  }
}

module.exports = { paymentsEnabled: enabled, buildPayment, verifySignature, validateWithPayfast };
