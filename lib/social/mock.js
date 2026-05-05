// Mock provider — for testing the cross-post flow end-to-end without
// registering any real developer apps. Always "credsOk", "Connect" is a
// no-op redirect that immediately stores a fake account, and `publish()`
// returns a fake external URL after a tiny delay.
//
// Disconnect it when you don't need it any more.
import { siteUrl } from './index.js'

export const id = 'mock'
export const label = 'Mock (test)'
export const approvalRequired = false
export const supports = ['text', 'image', 'video']

export function credsOk() { return true }

export function getAuthUrl(state) {
  // Skip the real OAuth round-trip: redirect straight back to our callback
  // with a fake code. The state still has to round-trip so the callback
  // signature check passes.
  return {
    url: `${siteUrl().replace(/\/$/, '')}/api/social/callback/mock?code=mock-${Date.now()}&state=${encodeURIComponent(state)}`,
  }
}

export async function exchangeCode({ code }) {
  return {
    access_token: `mock-token-${Date.now()}`,
    refresh_token: null,
    expires_at: null,
    meta: { test: true, code },
  }
}

export async function publish(account, post) {
  // Tiny artificial delay so it doesn't feel instant.
  await new Promise(r => setTimeout(r, 250))
  return {
    external_url: `https://example.com/mock/${post.id}`,
  }
}
