import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/database'

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
    data: { user },
  } = await supabase.auth.getUser()

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

  // Check if this route requires a specific role
  const matchedPrefix = Object.keys(PROTECTED_ROUTES).find((prefix) =>
    pathname.startsWith(prefix)
  )

  if (matchedPrefix) {
    const requiredRole = PROTECTED_ROUTES[matchedPrefix]

    // Not authenticated — redirect to login
    if (!user) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Authenticated but wrong role — redirect to their correct dashboard
    if (userRole !== requiredRole) {
      const dashboardUrl = request.nextUrl.clone()
      if (userRole === 'engineer') {
        dashboardUrl.pathname = '/engineer/dashboard'
      } else if (userRole === 'admin') {
        dashboardUrl.pathname = '/admin/dashboard'
      } else {
        dashboardUrl.pathname = '/client/dashboard'
      }
      return NextResponse.redirect(dashboardUrl)
    }
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/login' || pathname === '/register')) {
    const dashboardUrl = request.nextUrl.clone()
    if (userRole === 'engineer') {
      dashboardUrl.pathname = '/engineer/dashboard'
    } else if (userRole === 'admin') {
      dashboardUrl.pathname = '/admin/dashboard'
    } else {
      dashboardUrl.pathname = '/client/dashboard'
    }
    return NextResponse.redirect(dashboardUrl)
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
