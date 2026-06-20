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

## Recommended overall sequence

| Order | Action | Why |
|---|---|---|
| 1 | Transfer registrar CyberAdvert → xneelo | Get DNS control — SEO-invisible |
| 2 | Keep old nameservers pointing at old host | Old site stays live throughout |
| 3 | Inventory old URLs + build redirect map | Can only do while old site is live |
| 4 | Deploy new site to Netlify, add domain, pre-provision SSL, add `_redirects` | All ready before cutover |
| 5 | Lower DNS TTL (wait 24–48 h) | Minimises propagation window |
| 6 | Flip DNS to Netlify | Cutover — both sites were live before this |
| 7 | Keep old hosting active for a few weeks | Fallback + reference |

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
