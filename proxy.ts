import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/database'
import { filterInvalidAuthCookies } from '@/lib/supabase/sessionCookies'

/**
 * Role-based route protection map.
 * Key: route prefix (must match the start of the pathname)
 * Value: required role
 */
const PROTECTED_ROUTES: Record<string, 'engineer' | 'client' | 'admin'> = {
  '/engineer': 'engineer',
  '/client': 'client',
  '/admin': 'admin',
}

export default async function proxy(request: NextRequest) {
  const { invalidNames } = filterInvalidAuthCookies(
    request.cookies.getAll(), process.env.NEXT_PUBLIC_SUPABASE_URL!
  )
  invalidNames.forEach(name => request.cookies.delete(name))
  let supabaseResponse = NextResponse.next({ request })

  // Create a Supabase client that can read/write cookies in middleware
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Do not run any code between createServerClient and supabase.auth.getUser()
  // Doing so can cause session refresh issues.
  const {
    data: authData,
    error: authError,
  } = await supabase.auth.getUser()
  const user = authError ? null : authData.user
  invalidNames.forEach(name => supabaseResponse.cookies.set(name, '', { path: '/', maxAge: 0 }))

  let userRole: string | undefined
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()
    userRole = (profile as { role?: string } | null)?.role
  }

  const { pathname } = request.nextUrl

  // Redirects must carry any refreshed or cleared auth cookies too.
  const redirectWithSession = (url: URL) => {
    const response = NextResponse.redirect(url)
    supabaseResponse.cookies.getAll().forEach(cookie => response.cookies.set(cookie))
    return response
  }

  const hasRole = userRole === 'client' || userRole === 'engineer' || userRole === 'admin'

  // Check if this route requires a specific role
  // Match route segments, not raw string prefixes. Without the boundary
  // check, the public `/engineers` directory is treated as `/engineer/*`.
  const matchedPrefix = Object.keys(PROTECTED_ROUTES).find((prefix) =>
    pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  if (matchedPrefix) {
    const requiredRole = PROTECTED_ROUTES[matchedPrefix]

    // Not authenticated — redirect to login
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.search = ''
      loginUrl.searchParams.set('redirect', pathname + request.nextUrl.search)
      return redirectWithSession(loginUrl)
    }

    // Authenticated but wrong role — redirect to their correct dashboard
    if (userRole !== requiredRole) {
      const dashboardUrl = request.nextUrl.clone()
      dashboardUrl.search = ''
      if (!hasRole) {
        dashboardUrl.pathname = '/account-unavailable'
      } else if (userRole === 'engineer') {
        dashboardUrl.pathname = '/engineer/dashboard'
      } else if (userRole === 'admin') {
        dashboardUrl.pathname = '/admin/dashboard'
      } else {
        dashboardUrl.pathname = '/client/dashboard'
      }
      return redirectWithSession(dashboardUrl)
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/login' || pathname === '/register')) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.search = ''
    if (!hasRole) {
      dashboardUrl.pathname = '/account-unavailable'
    } else if (userRole === 'engineer') {
      dashboardUrl.pathname = '/engineer/dashboard'
    } else if (userRole === 'admin') {
      dashboardUrl.pathname = '/admin/dashboard'
    } else {
      dashboardUrl.pathname = '/client/dashboard'
    }
    return redirectWithSession(dashboardUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - Public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
