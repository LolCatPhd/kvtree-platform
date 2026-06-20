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

## ⚠️ CRITICAL: xneelo switches your nameservers automatically — and you can't pre-stage the zone

xneelo's own transfer page states:

> "When transferring your domain to xneelo, your name servers will
> **automatically switch to our default xneelo name servers**."

The previous version of this guide said "mirror the DNS zone into xneelo *before* the transfer." That is **wrong** — xneelo only gives you access to the DNS zone tool *after* the domain lands on your account. So there is no way to pre-populate the zone before the NS switch happens. You need a different approach.

### Why this matters

Today the domain's DNS lives on **KenesisPro** nameservers (`dns1/dns2.kenesispro.com`), and those nameservers hold all the live records:

| Record | Current value | What it serves |
|---|---|---|
| `A` (apex + www) | `165.73.140.19` | The **old website** (CyberAdvert hosting) |
| `MX` | `mail1/mail2.cyberadvert.co.za` | **Email** for `@kvtree.co.za` |

When the transfer completes and nameservers auto-flip to xneelo, **xneelo's zone will be empty** — site goes dark and email stops. This is the problem.

### The two real options

**Option A — Transfer with custom nameservers (keep KenesisPro NS)**

xneelo says: *"Need to transfer your domain with custom name servers? Launch Live Chat for manual assistance."*

This means you can ask xneelo to NOT auto-switch to their NS when the transfer completes. DNS stays on KenesisPro throughout — **zero downtime**, email and old site keep working exactly as they do today. You then create the zone in xneelo's DNS tool at your own pace, verify every record, and only switch NS when you're ready.

> This is the safest option for this specific scenario.
>
> **What to do:** Before or immediately after requesting the transfer at xneelo, open their Live Chat and say: *"I am transferring kvtree.co.za to xneelo as registrar only, with no hosting. I need to keep my current custom nameservers (dns1.kenesispro.com / dns2.kenesispro.com) and NOT switch to xneelo's default NS during the transfer. Please assist."*

**Option B — Cloudflare DNS (fully decouples DNS from registrar)**

Cloudflare (free) lets you create a zone for a domain *you don't own yet* and gives you two NS addresses. You change NS to Cloudflare at CyberAdvert **before** the transfer, then xneelo receives a domain whose NS already points to Cloudflare — they're welcome to keep it that way. DNS never moves; zone is always on Cloudflare regardless of who the registrar is.

> Best long-term setup (fast DNS, free, independent). More moving parts upfront.

### Note on xneelo as "registrar only"

You don't need a hosting package at xneelo — domain registration and DNS management are separate services. You can transfer a domain to xneelo and manage the DNS zone there without buying hosting. Their control panel gives you a DNS editor once the domain is on your account.

---

## Recommended overall sequence (revised — Option A)

| Order | Action | Why |
|---|---|---|
| 1 | Get CyberAdvert to update the **registrant email** to yours | So the `.za` approval email reaches you |
| 2 | **Look up all current DNS records** (MXToolbox, `dig`, or ask KenesisPro for a zone export) | Know every record before anything changes |
| 3 | **Request the transfer at xneelo** + immediately open Live Chat to request **custom NS** (keep KenesisPro's) | Prevents xneelo auto-switching NS on arrival |
| 4 | Approve the transfer via the registry email (`srszaticket@registry.net.za`) | Transfer completes; DNS stays on KenesisPro |
| 5 | In xneelo's DNS editor (now available), **create the zone** and add every record from Step 2 | Zone is ready on xneelo before you ever switch to it |
| 6 | Inventory old URLs + build redirect map | While old site is still live |
| 7 | Deploy new site to Netlify, add domain, pre-provision SSL, add `_redirects` | All ready before cutover |
| 8 | In xneelo DNS, **lower TTL** on A/CNAME records (wait 24–48 h) | Fast propagation when you flip |
| 9 | **Switch NS to xneelo** (now DNS has all records) + point `A`/`CNAME` to Netlify | Controlled cutover; propagates in minutes |
| 10 | Migrate email + flip `MX` to xneelo (separate guide) | Email moves when you're ready |

> The key change: Step 3's Live Chat request keeps DNS on KenesisPro during and after transfer, giving you time to build the xneelo zone properly (Step 5) before ever touching NS.

---

## After the switch

- Add the site to **Google Search Console** (Domain property) and submit the
  new **`sitemap.xml`**.
- Monitor the **Coverage / Pages** report for 404 spikes for 2–4 weeks and add
  any redirects you missed.
- You do **NOT** need Search Console's "Change of Address" tool — that's only
  for changing the actual domain name, which you are not doing.

---

## Other transfer notes

- **Approval email:** for `.za` domains the confirmation comes from
  **`srszaticket@registry.net.za`** to the **domain registrant's email address**.
  ⚠️ That address may be hidden / the old developer's (per WHOIS privacy) — ask
  CyberAdvert to update the registrant email to Pieter's before initiating, or
  the approval email won't reach you.
- **Timing rule:** `.za` (ccTLD) transfers need **7+ days** since registration
  or last transfer. `kvtree.co.za` was registered in **2008**, so this is fine.
- **Lock/hold:** WHOIS shows status `ok` (not locked) — no unlock step needed,
  but confirm it isn't placed on hold during the process.
- **No hosting needed at xneelo:** You are using xneelo as registrar only.
  Netlify hosts the site, Railway hosts the server. xneelo just holds the domain
  and lets you manage DNS.

---

## Next steps (developer tasks queued)

1. **URL inventory** — browse old site + Google `site:kvtree.co.za`, paste paths
   here → developer generates the full `_redirects` 301 map.
2. **SEO foundation** — already built into the new site:
   `sitemap.xml`, `robots.txt`, `LocalBusiness` JSON-LD, OG/Twitter metadata,
   per-page canonicals, blog route. ✅
3. **Google Places ID** — find on Google Maps (share link → copy `ChIJ…` part)
   → set `GOOGLE_PLACES_ID` env var on Railway → live Google reviews on homepage.
