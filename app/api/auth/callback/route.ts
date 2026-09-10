import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * POST /api/auth/callback
 * Handles email confirmation and OAuth callback from Supabase.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Resolve redirects from the canonical database profile role. Metadata
      // is retained only as a compatibility fallback for older accounts.
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { data: profile } = user
        ? await (supabase as any).from('profiles').select('role').eq('id', user.id).maybeSingle()
        : { data: null }
      const role = ((profile as { role?: string } | null)?.role ?? user?.user_metadata?.role) as string | undefined
      let redirectPath = next

      if (redirectPath === '/') {
        if (role === 'engineer') redirectPath = '/engineer/dashboard'
        else if (role === 'admin') redirectPath = '/admin/dashboard'
        else redirectPath = '/client/dashboard'
      }

      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // Return to login with an error if something went wrong
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
