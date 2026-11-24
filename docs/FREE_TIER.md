# Running Priism's backend on free plans

**Goal:** the private beta (about 15 testers) costs **$0 a month**, nothing is ever upgraded or billed automatically,
and you can see when usage approaches a limit.

## What Priism uses

| Service | Used for | Plan | Cost |
|---|---|---|---|
| Supabase (project `tsazewpipzgfwgcepcsb`) | Postgres (invites, Workshop, looks, bug reports), Auth (website sign-in), Storage (Workshop files), Edge Function `licence` (not deployed yet) | Free | $0 |
| GitHub Pages | the website (`site/`) | Free (public repo) | $0 |
| GitHub Actions / Releases | CI, desktop + Android builds, the daily keep-alive | Free (public repo) | $0 |
| Chrome Web Store | the extension | one-time $5 (paid already) | $0 |
| Whop | selling Pro after the beta | no monthly fee, 2.7% + 30¢ per sale | only when you sell |

Nothing else (no analytics, no image service, no always-on server).

## Supabase Free plan limits (checked November 2026)

These come from Supabase's docs: [billing](https://supabase.com/docs/guides/platform/billing-on-supabase),
[egress](https://supabase.com/docs/guides/platform/manage-your-usage/egress),
[storage size](https://supabase.com/docs/guides/platform/manage-your-usage/storage-size),
[upload limits](https://supabase.com/docs/guides/storage/uploads/file-limits),
[project pausing](https://supabase.com/docs/guides/platform/free-project-pausing) and
[auth rate limits](https://supabase.com/docs/guides/auth/rate-limits). Check them again before any big change: plans change.

| Item | Free plan | Pro plan ($25/month, includes $10 compute credit = 1 Micro project) |
|---|---|---|
| Database | 500 MB per project | 8 GB, then $0.125/GB |
| File storage | 1 GB | 100 GB, then $0.021/GB |
| Bandwidth (egress) | 5 GB uncached + 5 GB cached / month | 250 GB + 250 GB, then $0.09 / $0.03 per GB |
| Monthly active users | 50,000 | 100,000 |
| Largest file | 50 MB | 500 GB |
| Edge Function calls | 500,000 / month | 2 million |
| Image transformations | not available | 100, then $5 per 1,000 |
| Inactivity | paused after 1 week without database activity | never paused |
| Auth emails (built-in sender) | 2 per hour, and only to your own team | same, until you add your own SMTP |

**Over a Free limit:** you are never charged. Supabase emails you, gives a grace period, then restricts the service
(Fair Use Policy). That would break the Workshop and licence checks for everyone, so Priism stops uploads itself
before storage gets there (below).

## What Priism does to stay inside them

- **Upload limits, enforced by the database.** These are configurable on the Workshop page under Usage, or in the
  `app_limits` table:

  | Limit | Default |
  |---|---|
  | Wallpapers per person | 15 |
  | Storage per person | 60 MB |
  | Picture size | 20 MB, longest side 3840 px (4K) |
  | Video size | 30 MB |
  | Workshop total | 900 MB (under the 1 GB quota) |

  Admins aren't limited. The size counted is the stored file's real size from Storage, never what the browser
  reports. A file must be in your own folder.
- **Originals are kept** when they fit. Pictures over the limits are scaled to 4K and saved as 92% WebP in the
  browser (`site/media-prep.js`), with no paid image service. GIFs and videos are never re-encoded.
- **Small thumbnails:** 560 px WebP files of about 20–60 KB, instead of 640 px JPEG.
- **Caching:** uploaded files are cached for a year (`cacheControl: 31536000`), since file names are never reused.
  Browsing again doesn't use bandwidth, and repeat views are served from the CDN ("cached egress", a separate 5 GB).
- **Clean-up:** a failed upload removes its files. Files left behind by unfinished uploads show under Usage with a
  delete button.
- **Keep-alive:** `.github/workflows/keepalive.yml` reads one row a day, so the project is never paused.

## Monitoring

Workshop page › **Usage** (admins only). It shows:
- file storage, database size and this month's estimated wallpaper bandwidth against the Free plan, in green, then
  amber (70%), then red (90%)
- the top uploaders and the files left by unfinished uploads

Storage and database figures are exact. Bandwidth is an estimate from downloads (`usage_daily`, counted by
`count_use`): browsing thumbnails and the API aren't in it. For the real figure, see Supabase › Organization ›
Usage. Supabase also emails you when a quota is exceeded.

## Will it fit? (estimates)

Assumptions:
- An average 4K wallpaper is about 3 MB (WebP or JPEG), and a thumbnail is 40 KB.
- A third of users upload anything.
- Each user browses about 30 pages a month (24 thumbnails each; mostly cached after the first view).
- Each user downloads about 8 wallpapers a month at around 3 MB, and a few videos.

| Users | Storage (Workshop) | Bandwidth / month | Database | Fits Free? | Cost |
|---|---|---|---|---|---|
| **15** (beta) | ~50–200 MB (worst case at the limits: 15 × 60 MB = 900 MB, the cap) | ~0.5–2 GB | < 20 MB | **Yes** | **$0** |
| **100** | ~0.3–1 GB (the 900 MB cap stops uploads before 1 GB) | ~3–6 GB (cached + uncached) | < 50 MB | **Borderline.** Fits with the cap and caching; heavy video use doesn't | $0, or Pro $25/month |
| **500** | ~1.5–3 GB | ~15–30 GB | < 100 MB | No (storage and bandwidth) | **Pro ~$25/month** |
| **1,000** | ~3–6 GB | ~30–60 GB | < 200 MB | No | **Pro ~$25/month** (well inside Pro's 100 GB / 500 GB) |

Licence checks (once deployed) are one call a day per device: 1,000 devices is about 30,000 calls a month, against
500,000 free.

**What can't reliably stay free beyond the beta:** Workshop storage and bandwidth once there are more than a few
hundred users. The price is exact: Supabase Pro is **$25/month** (the $10 compute credit covers the Micro database),
and its included 100 GB storage and 250 + 250 GB bandwidth cover 1,000 users many times over. **Nothing is upgraded
without your approval.** Pro has a spend cap that is on by default, so overages can't happen unless you turn it off.

## Sign-in emails

The built-in sender only emails your own team (and 2 an hour), so testers can't receive confirmation emails from it.
Free options:
- **Google sign-in** (already set up on the website). No email needed. Recommended.
- **Your own SMTP** for email sign-up:
  - Gmail with an app password is free (about 500 emails a day).
  - Resend's free plan gives 3,000 emails a month, but needs your own domain (about $10–15 a year).

## Backups

The Free plan has no backups you can download. Export the database weekly (Supabase › Database › Backups ›
or `pg_dump`) **to a private place**. The repository is public, so its Actions artifacts can be read by anyone:
don't back up there.
