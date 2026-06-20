# KV Tree — Website Migration & SEO Transfer Guide

## The core distinction (read this first)

Two actions are often confused — only one carries SEO risk:

| Action | SEO risk |
|---|---|
| **Registrar transfer** (CyberAdvert → xneelo) | ❌ None — invisible to Google |
| **Replacing the old site with the new one** on the same domain | ⚠️ This is the real risk — entirely about URLs |

The old `www.kvtree.co.za` site has pages Google has indexed and possibly other
sites link to. Google's rankings are attached to **specific URLs**, not "the
website" in the abstract. If `www.kvtree.co.za/services.html` ranks today and
the new site doesn't answer that URL, it becomes a **404** → that ranking and
any backlink value evaporates.

The fix is **301 redirects** mapping every old URL to its best new equivalent.
Get that right and you keep the SEO. That's 90% of the job.

---

## Step 1 — Inventory the old site's URLs (do this while it's still live)

You can't redirect URLs you don't know about. Capture them **before** anything
changes:

- **Google Search Console** for the old site (get access from the old developer
  if possible — best source of what Google actually indexed).
- The old site's **`sitemap.xml`** — try `www.kvtree.co.za/sitemap.xml`.
- A **crawl** with Screaming Frog SEO Spider (free tier, up to 500 URLs — plenty
  for a small site).
- `site:kvtree.co.za` typed into Google — eyeball what's indexed.
- Which pages have **backlinks** — check free with Ubersuggest or Ahrefs free
  tier. Those are the most important URLs to preserve.

---

## Step 2 — Build the redirect map

For each old URL, choose the best matching new URL:

```
/services.html          →  /services
/about-us               →  /about
/contact.php            →  /contact
/tree-felling           →  /services      (or a specific service page)
```

Anything with no close match → send to the most relevant page (not the
homepage if a better match exists — relevance matters).

---

## Step 3 — Implement redirects on Netlify

Netlify uses a `_redirects` file (or `netlify.toml`). All redirects must be
**301** (permanent — this is what passes ranking credit; never use 302 for SEO).

Example `client/public/_redirects`:
```
/services.html   /services   301
/about-us        /about      301
/contact.php     /contact    301
/*               /           301   # catch-all fallback — use carefully
```

This lives in the codebase so it can be generated and committed before the
cutover. The developer can build the full file once the URL inventory is done.

---

## Step 4 — www vs non-www: pick one and be consistent

The old site uses **`www.kvtree.co.za`** and Google has indexed it that way.
**Recommended: keep `www` as the canonical** and 301-redirect the bare
`kvtree.co.za` → `www`. Whatever is chosen, add `<link rel="canonical">` tags
and be consistent. Changing this carelessly is a classic self-inflicted SEO wound.

Netlify handles this automatically once you set the "primary domain" in the
custom domain settings.

---

## Step 5 — Avoiding downtime during cutover

The old and new sites are two independent servers — DNS just controls which one
answers. With the right sequence the cutover is effectively zero-downtime:

1. **Fully deploy and test the new site** on its `*.netlify.app` URL first. Do
   not touch DNS until everything works perfectly.
2. In Netlify → **Domain management**, add `kvtree.co.za` and `www.kvtree.co.za`
   as custom domains and let it **pre-provision the SSL certificate** *before*
   flipping DNS so there is no HTTPS gap.
3. **Lower the DNS TTL** on the current A/CNAME records to **300 seconds** a day
   or two *before* the switch. This makes the DNS change propagate in minutes
   rather than hours. (Requires DNS access — another reason to sort out xneelo /
   CyberAdvert control first.)
4. **Flip the DNS** to Netlify. Because the new site is already live and SSL is
   ready, visitors hit a working site throughout — no real dark window.

> 💡 A **brief blip (minutes)** does **not** hurt SEO. Google doesn't penalise
> short downtime — it retries. Extended downtime or un-redirected 404s are what
> damage rankings. The 301 redirects are the insurance.

---

## ⚠️ CRITICAL: xneelo switches your nameservers automatically

xneelo's own transfer page states:

> "When transferring your domain to xneelo, your name servers will
> **automatically switch to our default xneelo name servers**."

This is the single biggest risk to avoid the site (and email) going dark.
Today the domain's DNS lives on **KenesisPro** nameservers
(`dns1/dns2.kenesispro.com`), and those nameservers hold all the live records:

| Record | Current value | What it serves |
|---|---|---|
| `A` (apex + www) | `165.73.140.19` | The **old website** (CyberAdvert hosting) |
| `MX` | `mail1/mail2.cyberadvert.co.za` | **Email** for `@kvtree.co.za` |

When the transfer completes and nameservers flip to xneelo, **xneelo's DNS will
be empty/default** — so unless you have **recreated those records in xneelo's
DNS first**, the website goes down AND email stops. This is the trap.

### Should the nameservers stay as the original (KenesisPro)?

You have two valid choices:

**Option A (recommended) — let nameservers switch to xneelo, but mirror the DNS
zone first.** Before/at transfer, rebuild the exact same records in xneelo's DNS
tool. Then when NS flips, xneelo serves identical records → **nothing goes
dark**, and you now control DNS. This is the clean end state.

**Option B — keep custom nameservers (KenesisPro) during transfer.** xneelo's
note says: *"Need to transfer your domain with custom name servers? Launch Live
Chat for manual assistance."* This keeps DNS on KenesisPro so nothing changes —
**but** DNS control stays with KenesisPro, which defeats the goal of taking
control. Only use this as a temporary measure.

👉 **Go with Option A.** Here's how:

### How to mirror the DNS zone into xneelo (Option A)

1. **Get the full current zone file** from CyberAdvert/KenesisPro — ask them to
   **export the DNS zone** for `kvtree.co.za`. This guarantees you don't miss
   any records (there may be SPF/TXT, autodiscover, or subdomain records beyond
   the obvious ones).
2. If they won't provide it, reconstruct from what's known and double-check with
   a DNS lookup tool. Known records to recreate at minimum:
   ```
   A      @      165.73.140.19
   A      www    165.73.140.19
   MX     @      mail1.cyberadvert.co.za   (priority 10)
   MX     @      mail2.cyberadvert.co.za   (priority 20)
   ```
   Plus any **TXT/SPF** record (e.g. `v=spf1 ...`) — important for email
   deliverability.
3. In xneelo, **set up a hosting package and use the DNS tool to import the zone
   file** (xneelo's page explicitly offers: *"import your current zone file
   using our DNS tool"*). Recreate every record exactly.
4. **Only then** complete the transfer / let nameservers switch. Because xneelo's
   DNS already mirrors the old setup, the website still points at the old host
   and email still flows to CyberAdvert — **zero downtime**.
5. Later, as a **separate, controlled step**, change the `A`/`CNAME` record in
   xneelo's DNS to point at **Netlify** (the actual old→new site cutover, with
   the 301 redirects from Steps 1–4 above). And change `MX` to xneelo when you
   migrate email (see the email migration guide).

### Other transfer-page notes worth knowing

- **Approval email:** for `.za` domains the confirmation comes from
  **`srszaticket@registry.net.za`** and is sent to the **domain registrant's
  email address**. ⚠️ That address is currently **hidden/possibly the old
  developer's** (per the WHOIS) — so you may need CyberAdvert to update the
  registrant email to yours first, or that approval email won't reach you.
- **Timing rule:** `.za` (ccTLD) transfers need **7+ days** since registration
  or last transfer. `kvtree.co.za` was registered in **2008**, so this is fine.
- **Lock/hold:** WHOIS shows status `ok` (not locked), so no unlock step is
  needed — but confirm it isn't put on hold during the process.

---

## Recommended overall sequence (revised)

| Order | Action | Why |
|---|---|---|
| 1 | Get CyberAdvert to update the **registrant email** to yours | So the `.za` approval email actually reaches you |
| 2 | **Export the current DNS zone** from CyberAdvert/KenesisPro | Needed to mirror it — old site/email stay live |
| 3 | Set up xneelo hosting + **import/recreate the DNS zone** in xneelo's DNS tool | xneelo NS will be ready *before* it goes live |
| 4 | **Initiate the transfer** and approve via the registry email | NS auto-switches to xneelo — but records already mirrored = no downtime |
| 5 | Inventory old URLs + build redirect map | Can only do while old site is live |
| 6 | Deploy new site to Netlify, add domain, pre-provision SSL, add `_redirects` | All ready before cutover |
| 7 | In xneelo DNS, **lower TTL** (wait 24–48 h) | Minimises propagation window |
| 8 | In xneelo DNS, **point `A`/`CNAME` at Netlify** | The real old→new site cutover |
| 9 | Migrate email + flip `MX` to xneelo (separate guide) | Email moves when you're ready |
| 10 | Keep old hosting active for a few weeks | Fallback + reference |

> The key change from a naïve transfer: **steps 2–3 (mirror the DNS zone) must
> happen BEFORE step 4 (the transfer)**, because xneelo wipes the nameservers to
> its own defaults. Skip this and the site + email go dark the moment the
> transfer completes.

---

## After the switch

- Add the site to **Google Search Console** (Domain property) and submit the
  new **`sitemap.xml`**.
- Monitor the **Coverage / Pages** report for 404 spikes for 2–4 weeks and add
  any redirects you missed.
- You do **NOT** need Search Console's "Change of Address" tool — that's only
  for changing the actual domain name, which you are not doing.

---

## Next steps (developer tasks queued)

1. **Crawl the old `www.kvtree.co.za` site** to produce the URL inventory and
   seed the redirect map.
2. **Build the SEO foundation** into the new site:
   - `client/public/_redirects` — 301 redirect file (once URL list is known).
   - `client/public/sitemap.xml` (or generated at build time).
   - `client/public/robots.txt`.
   - Canonical / `www` handling (Netlify primary domain setting).
   - `LocalBusiness` JSON-LD structured data (KV Tree name, phone, service area)
     — high value for local "near me" searches.
   - Open Graph / Twitter meta tags — nice link previews on WhatsApp/Facebook.
   - Per-page `<title>` and `<meta name="description">` tags.
