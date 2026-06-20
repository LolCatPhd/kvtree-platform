# Setting up WhatsApp for KV Tree (Meta / WhatsApp Business Platform)

Hi! 👋 This guide walks you through connecting KV Tree's website to WhatsApp so
the system can automatically message customers (quotes, invoices, payment
confirmations) and our crew (job assignments).

We're using **Meta's official WhatsApp Business Platform** (also called the
"Cloud API"). It's run by Meta/Facebook directly — no middle-man.

You can do all of this **on your phone** using a web browser. Where the phone
browser gets cramped, I'll tell you to tap **"Desktop site"** (Safari: tap
**aA** → *Request Desktop Website*; Chrome: tap **⋮** → tick *Desktop site*).

**Total time:** about 20–30 minutes. Take your time — you can stop and come
back. Nothing breaks if you pause.

---

## ⚠️ Read this first — 3 important things

1. **The phone number you use for the API CANNOT also be used in the normal
   WhatsApp / WhatsApp Business app at the same time.** When a number is
   connected to the API, it gets removed from the phone app.
   - 👉 **Best option: use a brand-new number** (a cheap spare SIM, or a second
     number) dedicated to the website. That way your personal/business WhatsApp
     on your phone keeps working exactly as it does now.
   - If you want to use your current business WhatsApp number, that's possible
     too — but tell me first, because it means that number leaves the phone app.

2. **Meta will ask for a payment card.** WhatsApp gives a free allowance every
   month (more than enough for us to start), but Meta still requires a card on
   file before they let the system send messages. You won't be charged unless we
   go over the free allowance, and I'll keep an eye on usage.

3. **Some things you'll copy and send to me** (long codes and a password-like
   "token"). **Please don't send the token in a normal WhatsApp or email** —
   I'll tell you a safe way to share it at the end. The other codes are fine to
   send normally.

---

## What you'll need before you start

- [ ] A Facebook account (personal is fine — it's only used to log in).
- [ ] The phone number you'll dedicate to the website (see warning #1), with the
      phone handy to receive a verification code.
- [ ] A debit/credit card.
- [ ] Business details (KV Tree's name, address, website `kvtree…`).

---

## The two ways to do this — pick one

**Option A (recommended — least work for you):** You create the WhatsApp
account and then **add me as an admin**. I do all the technical wiring myself
and just pull the codes I need. You only do Steps 1–4 and Step 7.

**Option B (you do it all):** You set everything up and copy 5 codes to me. Do
Steps 1–8.

I've written both. **Option A is much easier on a phone — I recommend it.**
If you're happy with Option A, you can skip Step 5 and Step 6.

---

## Step 1 — Open Meta Business settings

1. In your phone browser go to **https://business.facebook.com**
2. Log in with your Facebook account if asked.
3. If it asks you to **create a business account**, do it:
   - Business name: **KV Tree** (or *KV Tree Felling*)
   - Your name and **leslie.strydom@gmail.com** as the business email.
4. You should now see the **Meta Business Suite**. 🎉

> 💡 If you ever get lost, the home base for everything below is
> **https://business.facebook.com/settings** (Business Settings) and
> **https://business.facebook.com/wa/manage** (WhatsApp Manager).

---

## Step 2 — Verify your business (start it now, it takes a little time)

Meta likes to confirm KV Tree is a real business. This unlocks higher messaging
limits.

1. Go to **https://business.facebook.com/settings**
2. In the left menu (tap the **☰** lines if you're on a phone) find
   **Business info** or **Security Centre → Business verification**.
3. Fill in KV Tree's legal name, address, and phone, and follow the steps.
   Meta may ask for a document (e.g. a utility bill or business registration).

> This can take a day or two for Meta to approve. **You don't have to wait for
> it** to finish the rest — keep going. We can send a limited number of messages
> before it's verified, and the limit lifts once it's approved.

---

## Step 3 — Create the WhatsApp account & add your number

1. Go to **https://business.facebook.com/wa/manage** (WhatsApp Manager).
   - If it's your first time, you'll see a **"Add phone number"** or
     **"Get started"** button — tap it.
2. When asked, **create a new WhatsApp Business Account** named **KV Tree**.
3. **Display name:** enter **KV Tree** (this is the name customers see). Meta
   reviews display names — keep it to your real business name.
4. **Add the phone number** you're dedicating to the website (warning #1).
5. Choose **verify by SMS** (or voice call) and **enter the code** Meta sends to
   that number.
6. ✅ When the number shows a green/"Connected" status, this step is done.

---

## Step 4 — Add a payment method

1. Still in **WhatsApp Manager** (https://business.facebook.com/wa/manage),
   look for **Settings → Payment settings** (sometimes under
   **Billing & payments**).
2. **Add your card.** Choose **South Africa** and **ZAR** if asked.
3. That's it — you're set up to send. (Free allowance applies; I'll monitor it.)

---

## ➡️ If you chose Option A (recommended): Step 5–6 are mine — skip to Step 7

If you're doing **Option B (yourself)**, continue with Step 5.

---

## Step 5 — (Option B only) Create the developer "App"

This is the part that connects your WhatsApp account to our website's code.

1. In your phone browser, **turn on "Desktop site"** (see top of guide) — this
   page is fiddly on mobile.
2. Go to **https://developers.facebook.com/apps**
3. Tap **Create App**.
4. If asked **"What do you want your app to do?"**, choose
   **Other** → **Next** → app type **Business** → **Next**.
5. App name: **KV Tree Website**. Contact email: **leslie.strydom@gmail.com**.
   Link it to the **KV Tree** business account when asked. Tap **Create app**
   (it may ask for your Facebook password).
6. On the app dashboard, find **WhatsApp** in the product list and tap
   **Set up**.
7. Connect it to your **KV Tree** WhatsApp Business Account when prompted.

You'll now land on the **WhatsApp → API Setup** (or "Quickstart") page. **Keep
this page open — Step 6 copies things from here.**

---

## Step 6 — (Option B only) Copy the 5 codes for me

On the **WhatsApp → API Setup** page you'll see several values. Here's exactly
what to copy. (They're long — copy/paste, don't retype.)

| # | What it's called on the page | Looks like | 
|---|------------------------------|-----------|
| 1 | **Phone number ID** | a long number, e.g. `109xxxxxxxxxxxx` |
| 2 | **WhatsApp Business Account ID** (WABA ID) | a long number |
| 3 | **App ID** (top of the app dashboard) | a long number |
| 4 | **App secret** (Settings → Basic → App secret → *Show*) | letters+numbers |
| 5 | **Permanent access token** (see below — this is the important one) | very long string starting `EAA…` |

**Getting the permanent token (#5):**
The token shown on the Quickstart page **expires in 24 hours** — we need a
permanent one:

1. Go to **https://business.facebook.com/settings**
2. Left menu → **Users → System users** → **Add** → name it **KV Tree API**,
   role **Admin** → create.
3. Tap the new system user → **Assign assets** → select your **KV Tree** app
   **and** the **WhatsApp Account**, give **Full control / Manage**.
4. Tap **Generate token** → pick the **KV Tree Website** app → tick the
   permissions **`whatsapp_business_messaging`** and
   **`whatsapp_business_management`** → **Generate**.
5. **Copy the token immediately** (it's only shown once) — this is code #5.

Then send me codes 1–5 (see the secure-sharing note at the bottom for #5).

---

## Step 7 — (Option A — recommended) Add me as an admin

This lets me do Steps 5–6 myself so you don't have to touch the developer pages.

1. Go to **https://business.facebook.com/settings**
2. Left menu → **Users → People** → **Add**.
3. Enter **my email address (I'll give it to you separately)**.
4. Set role to **Admin** (or *Full control*) and tap **Next/Invite**.
5. When asked which assets to share, include the **KV Tree** business, the
   **WhatsApp Account**, and (if shown) the app. Give **Full control**.
6. Tap **Invite**. I'll accept, then finish the technical setup myself.

> After this, the only things I might still ask you for are quick approvals
> (e.g. confirming the display name) — I'll guide you if so.

---

## Step 8 — What I do on my side (for your awareness)

Once I have access/codes, I will:
- Plug the codes into the website's server settings (on Railway).
- Set up the **webhook** (so we know when messages are delivered/read). I
  generate this myself — nothing for you to do.
- Submit our **message templates** for approval (next section).
- Send a test message to confirm it's all working. ✅

---

## About message templates (why some messages need "approval")

WhatsApp has a rule: when **we** start a conversation with someone who hasn't
messaged us in the last 24 hours (e.g. sending a customer their quote, or
pinging a crew member about a new job), the message must use a **pre-approved
template**.

I'll create and submit these templates for approval (Meta usually approves
within minutes to a few hours). **You don't need to do anything for this** — but
so you know what they are, they'll be roughly:

- **Quote ready** – "Hi {name}, your KV Tree quotation for {service} is ready:
  {amount}. See attached PDF."
- **Invoice** – "Hi {name}, your KV Tree invoice {number} for {amount} is
  attached. Banking details inside."
- **Payment received** – "Hi {name}, we've received your payment of {amount}.
  Thank you!"
- **Crew job assignment** – "Hi {name}, you've been assigned a site visit for
  {customer} at {address}. Navigation link: {link}."

If Meta ever rejects one, I'll tweak the wording and resubmit — no action from
you.

---

## 🔒 How to safely send me the token (code #5)

The **access token** is like a password to your WhatsApp — anyone with it can
send messages as KV Tree. So:

- ✅ **Best:** If you did **Option A (added me as admin)**, you don't send the
  token at all — I generate it myself. Nothing sensitive to share. 🎉
- ✅ If you must send it, **split it in two**: send the first half by WhatsApp
  and the second half by email (or read it to me over a phone call).
- ❌ Don't post it anywhere public or in a group chat.

The other codes (Phone number ID, WABA ID, App ID) are **not** secret — you can
send those normally.

---

## Quick checklist

- [ ] Step 1 — Meta Business account created
- [ ] Step 2 — Business verification started
- [ ] Step 3 — WhatsApp account + dedicated number added & verified
- [ ] Step 4 — Payment card added
- [ ] **Option A:** Step 7 — added me as admin ✅ *(done!)*
- [ ] **Option B:** Steps 5–6 — created app & sent me the 5 codes

---

## If you get stuck

Snap a screenshot of wherever you're stuck and send it to me — I'll point at the
exact button. There's no way to break anything by clicking around in here, so
feel free to explore. Thank you! 🌳

---
---

# 🔧 Technical appendix (for the developer — not the admin)

This is what the codes map to in our codebase once they arrive.

### Credentials the admin provides (Option B) / I extract (Option A)

| Guide # | Meta name | Railway env var |
|---|---|---|
| 1 | Phone number ID | `WHATSAPP_PHONE_NUMBER_ID` |
| 2 | WhatsApp Business Account ID | `WHATSAPP_BUSINESS_ACCOUNT_ID` |
| 3 | App ID | `WHATSAPP_APP_ID` |
| 4 | App secret | `WHATSAPP_APP_SECRET` (webhook signature verify) |
| 5 | Permanent System-User token | `WHATSAPP_TOKEN` |

Plus values **I** generate:
- `WHATSAPP_VERIFY_TOKEN` — random string I set for webhook handshake.
- `WHATSAPP_API_VERSION` — Graph API version, e.g. `v21.0`.

### Send endpoint
```
POST https://graph.facebook.com/{WHATSAPP_API_VERSION}/{WHATSAPP_PHONE_NUMBER_ID}/messages
Authorization: Bearer {WHATSAPP_TOKEN}
Content-Type: application/json
```
- **Free-form text** (only inside the 24h customer-service window):
  `{ "messaging_product":"whatsapp", "to":"<E164>", "type":"text",
     "text":{ "body":"…" } }`
- **Template** (business-initiated, outside 24h window):
  `{ "messaging_product":"whatsapp", "to":"<E164>", "type":"template",
     "template":{ "name":"quote_ready", "language":{"code":"en"},
       "components":[ … parameters … ] } }`
- **Document/media** (quote & invoice PDFs): `type:"document"` with a public
  `link` (our `/files/...` URLs already work, same as the Twilio MediaUrl).

### Webhook (delivery + inbound)
- Callback URL: `https://<railway-app>/api/whatsapp/webhook`
- Configure under **App → WhatsApp → Configuration → Webhook**, verify with
  `WHATSAPP_VERIFY_TOKEN`, subscribe to the `messages` field.

### Code migration plan
- Replace `server/whatsapp.js` (currently Twilio) with a Meta Cloud API client,
  keeping the **same `sendWhatsApp({ to, body, mediaUrl })` signature** so
  nothing else in `index.js` changes. The `toE164()` normaliser stays as-is.
- Add a `sendTemplate({ to, name, language, components })` helper for the
  business-initiated cases (worker assignment, cold quote/invoice sends).
- Add `GET/POST /api/whatsapp/webhook` (verify handshake + delivery receipts).
- Templates to register against the WABA: `quote_ready`, `invoice_ready`,
  `payment_received`, `crew_assignment` (all **utility** category).
- Old Twilio env vars (`TWILIO_*`) can be removed after cutover.
