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
      // Get the user to determine their role for redirect
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const role = user?.user_metadata?.role as string | undefined
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
