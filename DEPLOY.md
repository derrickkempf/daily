# Deploy Guide — The Work

## Environment Variables

Create a `.env.local` file in the project root:

```bash
# ─── Database (required) ───────────────────────────────
POSTGRES_URL=postgresql://user:pass@host:5432/dbname

# ─── Admin auth (required) ────────────────────────────
# SHA-256 hash of your admin password
# Generate: echo -n "yourpassword" | shasum -a 256
ADMIN_HASH=your_sha256_hash_here

# ─── Blob storage (production) ────────────────────────
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# ─── Session signing (required) ───────────────────────
SESSION_SECRET=your_random_secret_string

# ─── Resend (for email auth) ──────────────────────────
RESEND_API_KEY=re_...

# ═══════════════════════════════════════════════════════
# SOCIAL SYNDICATION
# Each platform is optional. Only configure what you need.
# ═══════════════════════════════════════════════════════

# ─── X / Twitter ──────────────────────────────────────
# Create an app at developer.twitter.com → OAuth 1.0a + v2 read/write
X_API_KEY=
X_API_SECRET=
X_ACCESS_TOKEN=
X_ACCESS_TOKEN_SECRET=

# ─── Instagram ────────────────────────────────────────
# Requires a Facebook App, linked to an Instagram Business/Creator account.
# Get a long-lived token via the Graph API Explorer (developers.facebook.com)
# Scope needed: instagram_basic, instagram_content_publish, pages_read_engagement
IG_ACCESS_TOKEN=
IG_USER_ID=        # Your Instagram numeric user ID

# ─── LinkedIn ─────────────────────────────────────────
# Create app at linkedin.com/developers
# Scopes: w_member_social, r_liteprofile
LINKEDIN_ACCESS_TOKEN=
LINKEDIN_PERSON_URN=  # e.g. urn:li:person:XXXXXXXXXX

# ─── Pinterest ────────────────────────────────────────
# Create app at developers.pinterest.com
# Scopes: boards:read, pins:write
PINTEREST_ACCESS_TOKEN=
PINTEREST_BOARD_ID=    # The numeric board ID to post to

# ─── YouTube (coming soon) ────────────────────────────
# YOUTUBE_CLIENT_ID=
# YOUTUBE_CLIENT_SECRET=
# YOUTUBE_REFRESH_TOKEN=

# ─── TikTok (coming soon) ─────────────────────────────
# TIKTOK_CLIENT_KEY=
# TIKTOK_CLIENT_SECRET=
# TIKTOK_ACCESS_TOKEN=
```

## Setup

```bash
npm install
npm run db:setup     # creates tables
npm run dev          # starts on localhost:3000
```

## Admin Access

Visit `/feed/admin/login` and enter your admin password to unlock the compose button.

## Deployment

Deploy to Vercel:
1. Connect your GitHub repo
2. Add all env vars in the Vercel dashboard
3. Set up a Postgres database (Vercel Postgres or Neon)
4. Set up Vercel Blob for media storage
