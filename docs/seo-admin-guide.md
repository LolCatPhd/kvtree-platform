# KV Tree — SEO & Content Guide (for the website admin)

This guide explains how to keep KV Tree ranking well on Google **and** how to add
new content (blog posts, photos) to the website yourself — using **GitHub Copilot**
to do the actual code editing, so you never have to learn to code.

It's written for a non-developer. Take it slowly; nothing here can break the live
site (changes go through a review step before they go live).

---

## Part 1 — What SEO is, in plain terms

SEO (Search Engine Optimisation) is everything that helps KV Tree show up when
someone Googles *"tree felling Kempton Park"* or *"stump removal near me."*

Google ranks you on roughly three things:

1. **Relevant content** — pages that clearly answer what people search for.
2. **Trust signals** — Google Business Profile, reviews, other sites linking to you.
3. **Technical health** — fast site, mobile-friendly, no broken links, proper tags.

**Good news: the technical side (point 3) is already built and handled automatically.**
The site already has a sitemap, robots file, structured business data, share images,
canonical tags and per-page titles/descriptions. You don't need to touch any of that.

**Your job as admin is points 1 and 2** — adding fresh, genuine content and keeping
the business listings/reviews healthy. That's what this guide focuses on.

---

## Part 2 — The highest-value things you can do (in order)

Do these in order. The first two matter more than everything else combined.

### 1. Google Business Profile (do this first — it's free and the biggest win)

For a local business, the Google Business Profile (the box that appears on the right
when you Google the company, with the map, photos, hours and reviews) is the single
most powerful SEO asset.

- Go to **https://business.google.com** and claim/verify **KV Tree**.
- Fill in **everything**: services, service areas (Kempton Park, Benoni, Boksburg,
  Edenvale, Germiston, Modderfontein), hours, phone, website.
- Add **real photos** of jobs regularly — Google rewards active profiles.
- **Post updates** occasionally (a finished job, a seasonal note). It's like a mini
  social feed inside Google.

### 2. Reviews — ask for them, every time

Reviews directly affect local rankings *and* whether people choose you.

- After every happy job, send the customer a link to leave a Google review (the
  website can be set up to send this automatically over WhatsApp — ask the developer).
- Aim for a steady trickle rather than a sudden burst.
- **Reply to every review**, good or bad. Google notices engagement, and polite
  replies to criticism look great to future customers.

### 3. Fresh blog content (this is where Copilot comes in — see Part 3)

A new, genuinely useful blog post every 2–4 weeks tells Google the site is alive and
builds pages that rank for specific searches ("how much does stump grinding cost",
"what to do when a tree falls in a storm", etc.).

### 4. Keep details consistent everywhere ("NAP")

Your **N**ame, **A**ddress and **P**hone number must be **identical** on the website,
Google Business Profile, Facebook, and any directory. Even small differences
(e.g. "083" vs "+27 83") confuse Google. Pick one format and use it everywhere.

---

## Part 3 — Adding content with GitHub Copilot

The website lives in a **GitHub repository** (a folder of files stored online). You
edit it through the GitHub website — no software to install. **GitHub Copilot** is an
AI assistant that writes the code for you; you just tell it what you want in plain
English.

### Important: what Copilot can and can't do

| Task | Copilot? |
|---|---|
| Write a new blog post (the words + the code around it) | ✅ Yes |
| Write SEO titles, descriptions, alt text | ✅ Yes |
| Edit existing page text | ✅ Yes |
| **Upload an actual photo file** | ❌ No — you upload it yourself (easy, see below) |
| Take/create real job photos | ❌ No — those come from the crew's phone |

**So the pattern is always: you upload the photo through GitHub's website, then ask
Copilot to write the code that displays it.**

### How to upload a photo (no tools, just the browser)

1. Go to the repository on **github.com**.
2. Open the folder **`client/public/`** (this is where website images live).
3. Click **Add file → Upload files**.
4. **Drag your photo in** from your computer. Give it a clear lowercase name with no
   spaces, e.g. `oak-removal-benoni.jpg`.
5. At the bottom, choose **"Create a new branch and start a pull request"**, then
   **Commit changes**. (A "pull request" is just a proposed change that gets reviewed
   before going live — your safety net.)

Now the photo is in the project and Copilot can reference it.

### How to add a blog post with Copilot

The site is built so a new post is **three small edits**. You don't need to remember
them — just tell Copilot the goal and let it do the work. Open **Copilot Chat** in
GitHub (or the editor) and say something like:

> *"Add a new blog post to the KV Tree site titled 'How to Tell if a Tree is
> Dangerous'. Here are my notes: [paste 3–5 bullet points]. Follow the existing blog
> post pattern — create the content file in `src/content/blog/`, register it in
> `src/lib/posts.ts`, and add it to the slug map in `src/app/blog/[slug]/page.tsx`.
> Use the photo I uploaded at `client/public/dangerous-tree.jpg`."*

Copilot will produce the changes. Behind the scenes it's filling in:

- A **content file** at `src/content/blog/your-post-slug.tsx` (the article body).
- An **entry in `src/lib/posts.ts`** with the title, date, a one-line excerpt, tags
  and a read-time — this is what makes it appear on the `/blog` listing.
- A line in the **slug map** so the page actually loads.

Then you **commit / open a pull request**, the developer (or the automatic build)
checks it, and it goes live.

> 💡 You don't have to understand the code. Give Copilot good notes and the photo
> name, review the words it wrote for accuracy (Copilot can get facts wrong — make
> sure prices, claims and place names are correct), and submit.

### What makes a blog post rank well

Tell Copilot to keep these in mind (or just paste this list):

- **Answer one real question** people actually ask. Title it as that question.
- **Mention the area** naturally — "in Kempton Park", "across the East Rand".
- **Be genuinely useful and specific** — real prices, real steps, real experience.
  Generic AI filler ranks badly; specifics from actual jobs rank well.
- **300–800 words** is plenty. Quality over length.
- **One or two real photos** with descriptive names and alt text.
- **End with a call to action** ("request a free quote") — already built into the
  blog template.

⚠️ **Don't** publish ten near-identical "tree felling in [suburb]" pages with only the
suburb changed. Google treats that as spam. Each post must genuinely differ.

---

## Part 4 — Writing good SEO titles & descriptions

Every page has a **title** (the blue link in Google results) and a **meta
description** (the grey text under it). For blog posts these come from the `title`
and `excerpt` fields Copilot fills in. Good ones:

- **Title:** put the main search term near the front, keep under ~60 characters.
  - ✅ *"Tree Felling Cost in Kempton Park — 2025 Price Guide"*
  - ❌ *"Our Thoughts On Pricing And Various Considerations"*
- **Description (excerpt):** one or two sentences, ~120–155 characters, written for a
  human to want to click. Include the area and the benefit.
  - ✅ *"What tree felling really costs in Kempton Park, what drives the price, and
    how to get an accurate quote. Free estimates within 24 hours."*

Ask Copilot: *"Write an SEO-friendly title and a 150-character meta description for
this post, with the main keyword near the front."*

---

## Part 5 — Photos & alt text (a quiet SEO win)

Every photo should have **alt text** — a short description of what's in the image.
It helps blind users, and Google reads it for ranking (especially Google Images,
where people search "tree felling before and after").

- Name files descriptively: `stump-grinding-edenvale.jpg`, not `IMG_4821.jpg`.
- Ask Copilot: *"Add this image with descriptive, keyword-aware alt text."*
- Keep alt text natural: *"KV Tree crew grinding a large stump in an Edenvale garden"*
  — not a list of keywords.

---

## Part 6 — A simple monthly routine

You don't need to do much, just consistently:

- [ ] **Weekly:** add 1–2 fresh photos to the Google Business Profile.
- [ ] **Every 2–4 weeks:** publish one blog post (Copilot writes it from your notes).
- [ ] **After each job:** send the review request; reply to any new reviews.
- [ ] **Monthly:** glance at Google Business Profile insights (how many people called,
      asked directions, visited the site). It's motivating and shows what's working.

That cadence, kept up for a year, beats any one-off "SEO campaign."

---

## Part 7 — What NOT to do

- ❌ Don't buy "SEO packages" promising #1 rankings overnight — almost always a scam.
- ❌ Don't stuff keywords ("tree felling Kempton Park tree felling cheap tree felling")
  — Google penalises it and it reads terribly.
- ❌ Don't copy text from other sites (including competitors). Duplicate content hurts
  you and can be a legal problem.
- ❌ Don't display other companies' reviews as your own (this is misleading advertising).
- ❌ Don't delete or rename existing pages without telling the developer — it can break
  links Google has indexed. (If a page must change, a redirect is needed.)

---

## If you get stuck

- For **content/Copilot questions**, just ask Copilot in plain English — it's
  surprisingly good at "how do I…" questions about the site.
- For **anything that touches DNS, the domain, email, or the server**, ask the
  developer — those sit outside the Copilot/website-editing world.

The technical SEO foundation is already in place and maintained automatically. Your
contribution — fresh content, photos, reviews and a healthy Google Business Profile —
is the part that actually grows the rankings over time. 🌳
