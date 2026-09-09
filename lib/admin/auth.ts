import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type AdminProfile = { role?: string | null }

export async function getAdminContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, user: null, isAdmin: false }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  const profile = data as AdminProfile | null

  return {
    supabase,
    user,
    isAdmin: !error && profile?.role === 'admin',
  }
}

export async function requireAdminPage() {
  const context = await getAdminContext()

  if (!context.user) {
    redirect('/login?redirect=/admin/dashboard')
  }

  if (!context.isAdmin) {
    redirect('/')
  }

  return context
}
