# KV Tree — Email Mailbox Migration (CyberAdvert → xneelo)

## Current state (from DNS investigation)

| Record | Value |
|---|---|
| MX (primary) | `mail1.cyberadvert.co.za` (priority 10) |
| MX (backup) | `mail2.cyberadvert.co.za` (priority 20) |
| Email host | CyberAdvert (same company as the domain registrar) |

Any `@kvtree.co.za` mailboxes (e.g. `info@kvtree.co.za`, `pieter@kvtree.co.za`)
currently live on CyberAdvert's mail servers. Moving email is **independent** of
moving the website — you can do them at different times. Do email **after** the
domain is in xneelo so you control the MX records yourself.

---

## ⚠️ The golden rule of email migration

**Never cancel the old hosting until the new mailboxes are confirmed working and
all old emails have been copied across.** Email in transit during a badly managed
cutover is lost permanently with no recovery option.

---

## Step 0 — Find out what mailboxes exist

Before anything else, contact CyberAdvert (gavin@cyberadvert.co.za /
+27 10 001 8995) and ask:

- **What `@kvtree.co.za` mailboxes exist on their servers?**
  (e.g. `info@`, `pieter@`, `admin@`, etc.)
- **What protocol do they support for access?** IMAP is what you need for
  migration. They almost certainly support it.
- **What are the IMAP server settings and login credentials** for each mailbox?

Write these down — you need them for Step 3.

---

## Step 1 — Set up matching mailboxes on xneelo first

Once the domain is in xneelo (konsoleH control panel):

1. Log in to **konsoleH** at `https://konsole.xneelo.co.za`.
2. Go to **Email → Mailboxes → Add mailbox**.
3. Create a matching mailbox for each one that exists on CyberAdvert:
   - Same local part: if CyberAdvert has `info@kvtree.co.za`, create `info@` on
     xneelo too.
   - Set a **new strong password** for each (write them down).
4. Note the xneelo **IMAP settings** (konsoleH shows these — typically
   `mail.kvtree.co.za` or `mailhost.xneelo.co.za` on port 993 with SSL).

Do **not** change the MX records yet — old email still flows to CyberAdvert while
you copy everything across.

---

## Step 2 — Copy all old emails across (IMAP sync)

This copies every folder and old email from CyberAdvert into xneelo. Use one of
these tools:

### Option A — imapsync (best, free, command-line)
If you have a developer available:
```bash
imapsync \
  --host1 mail.cyberadvert.co.za --user1 info@kvtree.co.za --password1 OLD_PASS \
  --host2 mail.xneelo.co.za      --user2 info@kvtree.co.za --password2 NEW_PASS \
  --ssl1 --ssl2
```
Run once per mailbox. Safe to re-run — it skips already-copied messages.

### Option B — Thunderbird (phone/desktop, free, no tech knowledge needed)
1. Install **Mozilla Thunderbird** (desktop app, free).
2. Add **both** accounts in Thunderbird (CyberAdvert settings + xneelo settings).
3. **Drag and drop** folders from the old account to the new one.
   Thunderbird copies them over IMAP.

### Option C — Your phone's mail app
1. Add both accounts in your phone mail app.
2. Select all emails in a folder → Move → choose the xneelo account folder.
3. Repeat per folder. Fine for small mailboxes; tedious for large ones.

> 💡 **How much email is there?** If it's only a handful of folders and a few
> hundred emails, Option B or C is perfectly fine. imapsync is for large/busy
> mailboxes.

---

## Step 3 — Test the new mailboxes before cutting over

Before touching MX records:
1. **Send a test email** to `info@kvtree.co.za` from an external address (e.g.
   Gmail). It will arrive at CyberAdvert — that's fine, confirms the address works.
2. **Log in to the xneelo mailbox** via webmail or your mail app and confirm you
   can send *from* the xneelo account (it won't receive external mail yet — that
   starts after Step 4).
3. Confirm all old emails copied across look correct.

---

## Step 4 — Cut over: change the MX records

This is the moment new incoming mail routes to xneelo instead of CyberAdvert.
Because you now control DNS in xneelo/konsoleH:

1. Log in to **konsoleH → DNS Manager** for `kvtree.co.za`.
2. **Delete** the two existing MX records (CyberAdvert's):
   ```
   mail1.cyberadvert.co.za   priority 10
   mail2.cyberadvert.co.za   priority 20
   ```
3. **Add** xneelo's MX records (konsoleH will show you the exact values — they
   are typically):
   ```
   mail.kvtree.co.za   priority 10
   ```
   (xneelo may use their own hostname — follow what konsoleH says.)
4. Also update the **SPF record** (a TXT record) — xneelo's konsoleH usually
   creates this automatically, but confirm it exists. It tells other mail servers
   your mail is legitimate and prevents it landing in spam.
5. Set TTL to **3600** (1 hour) or whatever konsoleH recommends.

DNS propagation takes **15 minutes to a few hours**. During this window some mail
may still land at CyberAdvert — which is fine, see Step 5.

---

## Step 5 — Catch any mail that landed at CyberAdvert during propagation

After 24 hours:
1. Log in to CyberAdvert webmail one last time.
2. Check if any new emails arrived in that window and forward/move them manually.
3. That's the last time you need to touch CyberAdvert's mail.

---

## Step 6 — Update mail clients and phone

Tell everyone who accesses `@kvtree.co.za` email to **update their mail app
settings**:

| Setting | Old (CyberAdvert) | New (xneelo) |
|---|---|---|
| IMAP server | CyberAdvert's hostname | xneelo's hostname (from konsoleH) |
| SMTP server | CyberAdvert's hostname | xneelo's hostname |
| Port (IMAP) | 993 (SSL) | 993 (SSL) |
| Port (SMTP) | 465 or 587 | 465 or 587 |
| Username | full email address | full email address |
| Password | old password | new password (set in Step 1) |

---

## Step 7 — Add Resend's SPF/DKIM records (website transactional email)

Once xneelo controls DNS, add the records Resend provides (from the Resend
setup guide) so the website's automatic emails (quotes, invoices, receipts) are
authenticated and don't land in spam:

- **TXT record** — Resend's DKIM key (long string they provide).
- **TXT record** — Update SPF to include `include:spf.resend.com` alongside
  xneelo's SPF.

konsoleH lets you add both easily. Resend's dashboard shows the exact records.

---

## Step 8 — Keep CyberAdvert account open briefly, then cancel

- **Don't cancel immediately** — give it 2–4 weeks to be safe.
- After confirming all mail flows correctly to xneelo and no stray emails are
  arriving at CyberAdvert, cancel the CyberAdvert hosting/mail plan.
- The domain is already at xneelo by this point, so cancelling hosting has no
  effect on the website or DNS.

---

## Timeline summary

```
Day 0        Domain transfer initiated (CyberAdvert → xneelo)
Day 1–5      Domain lands in xneelo. DNS still pointing at old hosts.
Day 5        Create mailboxes on xneelo (Step 1).
Day 5–6      Copy all emails across (Step 2). Test (Step 3).
Day 6        Flip MX records to xneelo (Step 4). ← Email cutover moment
Day 7        Check CyberAdvert for stragglers (Step 5).
Day 7        Update all mail clients/phones (Step 6).
Day 7        Add Resend DNS records (Step 7).
Week 3–4     Confirm all good → cancel CyberAdvert hosting. (Step 8)
```

---

## What could go wrong and how to fix it

| Problem | Cause | Fix |
|---|---|---|
| Incoming email disappears | MX flipped before new mailboxes were ready | Flip MX back to CyberAdvert, set up xneelo mailboxes properly first |
| Outgoing mail goes to spam | SPF not updated | Add/update SPF TXT record in konsoleH to include xneelo's servers |
| Mail client can't connect | Wrong hostname or port | Get exact settings from konsoleH → Email → Mailbox settings |
| Email arrives at old server after cutover | DNS propagation lag | Normal — check CyberAdvert webmail once 24 h after cutover and forward manually |
| CyberAdvert won't give IMAP credentials | They refuse to cooperate | Escalate: ask xneelo support to assist; IMAP access is a right for the account holder |

---

## Quick checklist

- [ ] Confirm all `@kvtree.co.za` mailboxes with CyberAdvert (Step 0)
- [ ] Domain transferred to xneelo and DNS in konsoleH
- [ ] New mailboxes created on xneelo (Step 1)
- [ ] All emails copied across via imapsync / Thunderbird (Step 2)
- [ ] New mailboxes tested for send/receive (Step 3)
- [ ] MX records flipped to xneelo (Step 4)
- [ ] Straggler check on CyberAdvert after 24 h (Step 5)
- [ ] All mail clients / phones updated (Step 6)
- [ ] Resend SPF + DKIM records added (Step 7)
- [ ] CyberAdvert account cancelled after 3–4 weeks (Step 8)
