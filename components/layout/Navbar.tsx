'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, ChevronRight, HardHat } from 'lucide-react'

const NAV_LINKS = [
  { label: 'Engineers', href: '/engineers' },
  { label: 'Projects', href: '/projects' },
  { label: 'Tools', href: '/tools' },
  { label: 'Resources', href: '/resources' },
  { label: 'Opportunities', href: '/opportunities' },
]

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white border-b border-[var(--color-ch-border)] shadow-[0_1px_8px_0_rgb(15_28_46/0.06)]'
            : 'bg-white border-b border-[var(--color-ch-border)]'
        }`}
      >
        <div className="ch-container">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2 shrink-0"
              aria-label="CivilHub home"
            >
              <div className="w-8 h-8 bg-[var(--color-ch-navy)] rounded-md flex items-center justify-center">
                <HardHat size={16} className="text-[var(--color-ch-orange)]" />
              </div>
              <span className="font-bold text-lg tracking-tight text-[var(--color-ch-navy)]">
                Civil<span className="text-[var(--color-ch-orange)]">Hub</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                    isActive(link.href)
                      ? 'text-[var(--color-ch-navy)] bg-[var(--color-ch-surface)]'
                      : 'text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)] hover:bg-[var(--color-ch-surface)]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login" className="ch-btn ch-btn-ghost text-sm px-4 py-2">
                Log In
              </Link>
              <Link href="/register" className="ch-btn ch-btn-primary text-sm px-4 py-2">
                Join CivilHub
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="md:hidden p-2 rounded-md text-[var(--color-ch-text-secondary)] hover:bg-[var(--color-ch-surface)] transition-colors"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Drawer */}
      <div
        id="mobile-menu"
        role="navigation"
        aria-label="Mobile navigation"
        className={`fixed top-16 left-0 right-0 z-40 bg-white border-b border-[var(--color-ch-border)] md:hidden transition-all duration-300 ${
          mobileOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-2 pointer-events-none'
        }`}
      >
        <div className="ch-container py-3 flex flex-col gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? 'text-[var(--color-ch-navy)] bg-[var(--color-ch-surface)]'
                  : 'text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)] hover:bg-[var(--color-ch-surface)]'
              }`}
            >
              {link.label}
              <ChevronRight size={16} className="opacity-40" />
            </Link>
          ))}

          <div className="border-t border-[var(--color-ch-border)] mt-2 pt-3 flex flex-col gap-2">
            <Link href="/login" className="ch-btn ch-btn-outline w-full justify-center">
              Log In
            </Link>
            <Link href="/register" className="ch-btn ch-btn-primary w-full justify-center">
              Join CivilHub
            </Link>
          </div>
        </div>
      </div>

      {/* Spacer to offset fixed header */}
      <div className="h-16" aria-hidden="true" />
    </>
  )
}
