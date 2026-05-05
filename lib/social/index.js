// ════════════════════════════════════════════════════════════════
// SOCIAL — provider registry + cross-post orchestration
//
// Each provider lives in ./{name}.js and exports:
//   id        : 'x' | 'linkedin' | ...
//   label     : human label
//   credsOk() : returns true if env vars are set
//   approvalRequired : true if the platform needs business app review
//                     before content_publish actually works
//   getAuthUrl(state)         : returns an OAuth start URL
//   exchangeCode(code, state) : returns { access_token, refresh_token, expires_at, meta }
//   publish(account, post)    : returns { external_url } or throws
//
// The `publish()` step is invoked for each platform the admin checked
// in the composer. We log every attempt to post_crossposts.
// ════════════════════════════════════════════════════════════════
import { query } from '@/lib/db'

import * as x         from './x.js'
import * as linkedin  from './linkedin.js'
import * as pinterest from './pinterest.js'
import * as instagram from './instagram.js'
import * as youtube   from './youtube.js'
import * as tiktok    from './tiktok.js'

export const PROVIDERS = { x, linkedin, pinterest, instagram, youtube, tiktok }
export const PROVIDER_IDS = Object.keys(PROVIDERS)

export function getProvider(id) {
  return PROVIDERS[id] || null
}

/** Return the connection + capability status for every provider.
 *  Falls back gracefully if the DB query fails (e.g. table missing on
 *  first cold start) — providers will still render, just with
 *  connected: false everywhere. */
export async function getAllStatus() {
  let map = {}
  try {
    const accounts = await query(`SELECT provider, expires_at, meta FROM social_accounts`)
    map = Object.fromEntries(accounts.map(a => [a.provider, a]))
  } catch (err) {
    console.warn('[social] could not read social_accounts:', err.message)
  }
  return PROVIDER_IDS.map(id => {
    const p = PROVIDERS[id]
    const acct = map[id]
    return {
      id,
      label: p.label,
      credsOk: p.credsOk(),
      approvalRequired: !!p.approvalRequired,
      supports: p.supports || ['text', 'image', 'video'],
      connected: !!acct,
      expiresAt: acct?.expires_at || null,
      meta: acct?.meta || null,
    }
  })
}

/** Persist the OAuth result for a provider. */
export async function saveAccount(provider, tokens) {
  const { access_token, refresh_token = null, expires_at = null, meta = {} } = tokens
  await query(
    `INSERT INTO social_accounts (provider, access_token, refresh_token, expires_at, meta, connected_at)
     VALUES ($1, $2, $3, $4, $5::jsonb, now())
     ON CONFLICT (provider) DO UPDATE
       SET access_token  = EXCLUDED.access_token,
           refresh_token = COALESCE(EXCLUDED.refresh_token, social_accounts.refresh_token),
           expires_at    = EXCLUDED.expires_at,
           meta          = EXCLUDED.meta,
           connected_at  = now()`,
    [provider, access_token, refresh_token, expires_at, JSON.stringify(meta)],
  )
}

export async function getAccount(provider) {
  const rows = await query(
    `SELECT provider, access_token, refresh_token, expires_at, meta FROM social_accounts WHERE provider = $1`,
    [provider]
  )
  return rows[0] || null
}

export async function disconnect(provider) {
  await query(`DELETE FROM social_accounts WHERE provider = $1`, [provider])
}

/**
 * Enqueue and immediately attempt to publish to each provider.
 * Best-effort: logs every result to post_crossposts. Errors don't throw.
 */
export async function enqueueCrosspost(postId, providerIds) {
  const [post] = await query(
    `SELECT id, kind, caption, media_url, media_type FROM posts WHERE id = $1`,
    [postId]
  )
  if (!post) return

  for (const pid of providerIds) {
    const provider = PROVIDERS[pid]
    if (!provider) continue

    // Insert pending row
    const [{ id: jobId }] = await query(
      `INSERT INTO post_crossposts (post_id, provider, status)
       VALUES ($1, $2, 'pending') RETURNING id`,
      [postId, pid]
    )

    try {
      if (!provider.credsOk()) {
        await markJob(jobId, 'skipped', null, 'Credentials not configured')
        continue
      }
      const acct = await getAccount(pid)
      if (!acct) {
        await markJob(jobId, 'skipped', null, 'Not connected')
        continue
      }
      if (provider.approvalRequired && !acct.meta?.publish_approved) {
        await markJob(jobId, 'skipped', null,
          `${provider.label} content publishing is pending platform approval`)
        continue
      }
      const result = await provider.publish(acct, post)
      await markJob(jobId, 'sent', result?.external_url || null, null)
    } catch (err) {
      console.error(`[social:${pid}] publish failed:`, err.message)
      await markJob(jobId, 'failed', null, err.message?.slice(0, 500) || 'unknown error')
    }
  }
}

async function markJob(id, status, url, err) {
  await query(
    `UPDATE post_crossposts
       SET status = $2, external_url = $3, error = $4, updated_at = now()
     WHERE id = $1`,
    [id, status, url, err]
  )
}

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
}

export function postUrl(postId) {
  return `${siteUrl().replace(/\/$/, '')}/?p=${postId}`
}
