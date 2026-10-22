import { stringFromBase64URL } from '@supabase/ssr'

type SessionCookie = { name: string; value: string }

// SSR 0.5 decodes storage before getUser() and can throw on malformed UTF-8.
// Validate only the encoding with its own decoder; Auth still verifies sessions.
export function filterInvalidAuthCookies(cookies: SessionCookie[], supabaseUrl: string) {
  const storageKey = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`
  const invalidNames = new Set<string>()
  for (const key of [storageKey, `${storageKey}-code-verifier`]) {
    const members = cookies.filter(cookie => cookie.name === key || (
      cookie.name.startsWith(`${key}.`) && /^(0|[1-9][0-9]*)$/.test(cookie.name.slice(key.length + 1))
    ))
    let encoded = members.find(cookie => cookie.name === key)?.value || ''
    if (!encoded) {
      for (let index = 0; ; index++) {
        const chunk = members.find(cookie => cookie.name === `${key}.${index}`)?.value
        if (!chunk) break
        encoded += chunk
      }
    }
    if (!encoded.startsWith('base64-')) continue
    try {
      stringFromBase64URL(encoded.slice('base64-'.length))
    } catch {
      members.forEach(cookie => invalidNames.add(cookie.name))
    }
  }
  return {
    cookies: cookies.filter(cookie => !invalidNames.has(cookie.name)),
    invalidNames: [...invalidNames],
  }
}
