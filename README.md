# Timeline

> An independent social channel — chronological, art-foreward, single-author.
> Mirrors posts to X, LinkedIn, Pinterest, Instagram, YouTube, and TikTok.

Designed in the [Visualize Value](https://visualizevalue.com) aesthetic
(see `vv-design-system.md`): black on white, borders not shadows, type
doing the heavy lifting.

---

## What's here

| Page | What it does |
|------|--------------|
| `/` | The timeline. Newest post on top. Drag-and-drop composer for the admin. |
| `/about` | Standalone narrative — what this is, why it exists. |
| `/admin` | Password-gated. Connect cross-post providers, sign out. |

Visitors verify their email (one-time code) before they can like, comment, or
share. Only the admin can post.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Database | Postgres (Neon recommended) |
| Media storage | Vercel Blob (prod) / local FS (dev) |
| Email | Resend |
| Hosting | Vercel |
| Fonts | Geist Sans + Geist Mono |

## Getting started

```bash
cp .env.example .env.local
# Fill in POSTGRES_URL, SESSION_SECRET, ADMIN_HASH
npm install
npm run db:setup     # creates all tables
npm run dev
```

### Required env vars

| Var | Purpose |
|-----|---------|
| `POSTGRES_URL` | Connection string. Neon free tier is enough. |
| `SESSION_SECRET` | Any 32+ char random string. |
| `ADMIN_HASH` | `echo -n 'yourpassword' \| shasum -a 256` — paste the hex. |
| `RESEND_API_KEY` | Email codes. Optional in dev — codes log to console. |
| `BLOB_READ_WRITE_TOKEN` | Production only. Dev uses `public/uploads`. |
| `NEXT_PUBLIC_SITE_URL` | Used for share links + OAuth redirects. |

## Cross-posting reality check

The composer offers a checkbox per platform. What actually happens depends on
the platform's developer policy.

| Platform | Day-1 reality |
|----------|---------------|
| **X** | Works once you have a developer app. Free tier allows ~500 posts/mo. |
| **LinkedIn** | Works after enabling "Sign In With LinkedIn" + "Share on LinkedIn" products. |
| **Pinterest** | Works once you have an app and a board ID. |
| **YouTube** | Works for video posts. Default quota = ~6 uploads/day; request more. |
| **Instagram** | OAuth works, **publishing requires Meta App Review** for `instagram_content_publish`. Skipped until approved. |
| **TikTok** | OAuth works, **publishing requires TikTok app review**. Skipped until approved. |

The two approval-gated platforms are wired and ready — once the platform
approves your app you flip `meta.publish_approved = true` for that
`social_accounts` row and it goes live.

### Connecting a platform

1. Sign in at `/admin`.
2. Set the env vars for that platform (see `.env.example`).
3. Restart the dev server / redeploy.
4. Click **Connect →** in the admin table.
5. After OAuth, the row flips to `connected: yes`. Now you can check it in the composer.

## Project structure

```
.
├── app/
│   ├── api/
│   │   ├── auth/                  email-code login (visitors)
│   │   ├── admin/                 password login (you)
│   │   ├── posts/                 CRUD + likes + comments + shares
│   │   ├── social/                OAuth start, callback, status
│   │   └── upload/                multipart → Blob / local
│   ├── components/                Header, Footer, SignInPill, Timeline,
│   │                              PostCard, Composer
│   ├── admin/                     dashboard + login UI
│   ├── about/                     About page
│   ├── globals.css                VV design tokens — single source of truth
│   ├── layout.js                  fonts, header, footer
│   └── page.js                    timeline (home)
├── lib/
│   ├── db.js                      Postgres pool + auto-migration
│   ├── db-setup.mjs               manual `npm run db:setup`
│   ├── storage.js                 saveUpload(buffer, filename)
│   ├── auth.js                    visitor sessions
│   ├── admin.js                   admin sessions
│   ├── email.js                   Resend wrapper (logs in dev)
│   └── social/
│       ├── index.js               provider registry + queue
│       ├── x.js
│       ├── linkedin.js
│       ├── pinterest.js
│       ├── instagram.js
│       ├── youtube.js
│       └── tiktok.js
├── middleware.js                  CORS for /api/*
├── next.config.mjs
├── package.json
├── jsconfig.json
└── .env.example
```

## Database schema

`npm run db:setup` creates:

- `users(email)`
- `verification_codes(email, code, expires_at, used)`
- `posts(id, kind, caption, media_url, media_type, width, height, created_at)`
- `post_likes(post_id, email)`
- `post_comments(post_id, email, body)`
- `post_shares(post_id, email, target)`
- `social_accounts(provider, access_token, refresh_token, expires_at, meta)`
- `post_crossposts(post_id, provider, status, external_url, error)`

## Deploying

This is Vercel-shaped:

1. Push this folder to a fresh GitHub repo.
2. Import into Vercel.
3. Add a Neon Postgres integration (sets `POSTGRES_URL`).
4. Add a Vercel Blob store (sets `BLOB_READ_WRITE_TOKEN`).
5. Set `SESSION_SECRET`, `ADMIN_HASH`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`.
6. Set whichever per-platform OAuth vars you've got so far.
7. Deploy.

After the first deploy, run `npm run db:setup` against the production DB
(or just hit `/api/auth/session` once — auto-migration runs on first DB query).

## License

Private — for Derrick's use.
