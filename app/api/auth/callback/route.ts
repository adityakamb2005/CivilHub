import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { safeRedirectPath } from '@/lib/auth/redirectPath'

/**
 * GET /api/auth/callback
 * Handles email confirmation and OAuth callback from Supabase.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeRedirectPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Only the canonical database role may select a workspace.
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()
      if (userError || !user) {
        return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
      }

      const { data: profile } = await (supabase as any)
        .from('profiles').select('role').eq('id', user.id).maybeSingle()
      const role = (profile as { role?: string } | null)?.role
      let redirectPath = next

      if (redirectPath === '/') {
        if (role === 'engineer') redirectPath = '/engineer/dashboard'
        else if (role === 'admin') redirectPath = '/admin/dashboard'
        else if (role === 'client') redirectPath = '/client/dashboard'
        else redirectPath = '/account-unavailable'
      }

      return NextResponse.redirect(`${origin}${redirectPath}`)
    }
  }

  // Return to login with an error if something went wrong
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
