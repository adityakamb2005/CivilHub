'use client'

import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function AdminHeaderActions() {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-sm text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)] flex items-center gap-1.5 transition-colors"
    >
      <LogOut size={16} />
      <span className="hidden sm:block">Sign out</span>
    </button>
  )
}
