'use client'

import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

/**
 * Browser Supabase client — use in Client Components only.
 * Creates a new instance per call (safe because Supabase caches internally).
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
