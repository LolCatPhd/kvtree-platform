// Google Calendar integration via a service account. When a job is scheduled,
// an event is created on the configured calendar (and updated/removed when the
// job changes). Fully functional once the GOOGLE_SA_* env vars are set;
// otherwise calendarEnabled is false and the helpers are no-ops.
//
// Env:
//   GOOGLE_SA_EMAIL        service account client_email
//   GOOGLE_SA_PRIVATE_KEY  service account private_key (\n-escaped is fine)
//   GOOGLE_CALENDAR_ID     target calendar id (default "primary")
//
// Share the target calendar with the service account email (Make changes to
// events) so it can write. To invite attendees you may need domain-wide
// delegation; without it, events are still created without sending invites.
const jwt = require('jsonwebtoken');

const SA_EMAIL = process.env.GOOGLE_SA_EMAIL;
const SA_KEY = (process.env.GOOGLE_SA_PRIVATE_KEY || '').replace(/\\n/g, '\n');
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';
const TIMEZONE = process.env.CALENDAR_TIMEZONE || 'Africa/Johannesburg';

const enabled = Boolean(SA_EMAIL && SA_KEY);

if (!enabled) {
  console.warn('⚠️  Google Calendar not configured — job events will not be created.');
}

let cachedToken = null; // { token, exp }

async function getAccessToken() {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.token;
  const iat = Math.floor(Date.now() / 1000);
  const assertion = jwt.sign(
    {
      iss: SA_EMAIL,
      scope: 'https://www.googleapis.com/auth/calendar',
      aud: 'https://oauth2.googleapis.com/token',
      iat,
      exp: iat + 3600,
    },
    SA_KEY,
    { algorithm: 'RS256' }
  );
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }).toString(),
  });
  if (!res.ok) throw new Error(`Google token error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  cachedToken = { token: data.access_token, exp: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

const calUrl = (path = '') =>
  `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events${path}`;

function buildEventBody({ summary, description, startISO, durationHours = 2, location, attendees }) {
  const start = new Date(startISO);
  const end = new Date(start.getTime() + durationHours * 3600 * 1000);
  return {
    summary,
    description,
    location,
    start: { dateTime: start.toISOString(), timeZone: TIMEZONE },
    end: { dateTime: end.toISOString(), timeZone: TIMEZONE },
    attendees: (attendees || []).filter(Boolean).map((email) => ({ email })),
  };
}

// Returns { id, link } or null if disabled / on failure (never throws).
async function createEvent(opts) {
  if (!enabled || !opts.startISO) return null;
  try {
    const token = await getAccessToken();
    const res = await fetch(calUrl(), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(buildEventBody(opts)),
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    const data = await res.json();
    return { id: data.id, link: data.htmlLink };
  } catch (err) {
    console.error('📅 Calendar createEvent failed:', err.message);
    return null;
  }
}

async function updateEvent(eventId, opts) {
  if (!enabled || !eventId) return null;
  try {
    const token = await getAccessToken();
    const res = await fetch(calUrl(`/${encodeURIComponent(eventId)}`), {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(buildEventBody(opts)),
    });
    if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
    const data = await res.json();
    return { id: data.id, link: data.htmlLink };
  } catch (err) {
    console.error('📅 Calendar updateEvent failed:', err.message);
    return null;
  }
}

async function deleteEvent(eventId) {
  if (!enabled || !eventId) return;
  try {
    const token = await getAccessToken();
    await fetch(calUrl(`/${encodeURIComponent(eventId)}`), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    console.error('📅 Calendar deleteEvent failed:', err.message);
  }
}

module.exports = { calendarEnabled: enabled, createEvent, updateEvent, deleteEvent };
