# The Work — Art Timeline

An independent social channel + art timeline. Combines the chronological clarity
of Facebook's original timeline with the visual focus of Instagram and the
real-time energy of X.

## Features

- **Timeline view** — posts grouped by year, art-first design
- **Drag & drop upload** — images and video
- **Social interactions** — likes, comments, share to X/Instagram/LinkedIn/Pinterest
- **Cross-posting** — post once, syndicate to all platforms automatically
- **Admin mode** — password-protected compose with full media upload
- **Two pages** — Timeline (`/`) and About (`/about`)

## Tech

- Next.js 15 (App Router)
- PostgreSQL (posts, likes, comments)
- Vercel Blob (media storage)

## Setup

See [DEPLOY.md](./DEPLOY.md) for full setup including social API configuration.

```bash
npm install
npm run db:setup
npm run dev
```

Admin login: `/admin`
