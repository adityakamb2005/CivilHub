import Link from 'next/link'
import { HardHat } from 'lucide-react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[var(--color-ch-surface)] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[var(--color-ch-navy)]/5 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[300px] bg-[var(--color-ch-orange)]/5 blur-3xl rounded-full" />
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 bg-[var(--color-ch-navy)] rounded-lg flex items-center justify-center shadow-md">
            <HardHat size={20} className="text-[var(--color-ch-orange)]" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-[var(--color-ch-navy)]">
            Civil<span className="text-[var(--color-ch-orange)]">Hub</span>
          </span>
        </Link>
        {children}
      </div>
    </div>
  )
}
