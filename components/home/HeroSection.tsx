import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Search, Shield } from 'lucide-react'

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden bg-[var(--color-ch-navy)] text-white"
      aria-labelledby="hero-heading"
    >
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&auto=format&fit=crop&q=70"
          alt="Construction site with cranes and structural steel"
          fill
          priority
          className="object-cover object-center opacity-20"
          sizes="100vw"
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-ch-navy)] via-[var(--color-ch-navy)]/85 to-[var(--color-ch-navy)]/60" />
      </div>

      <div className="relative z-10 ch-container py-24 md:py-36">
        <div className="max-w-3xl">
          {/* Label */}
          <div className="ch-section-label mb-6 animate-fade-in">
            <Shield size={12} />
            <span>Professional Civil Engineering Platform</span>
          </div>

          {/* Headline */}
          <h1
            id="hero-heading"
            className="ch-text-hero text-white mb-6 animate-slide-up"
            style={{ animationDelay: '0.1s' }}
          >
            Connect.{' '}
            <span className="text-[var(--color-ch-orange)]">Build.</span>{' '}
            Manage.{' '}
            <span className="text-[var(--color-ch-orange)]">Grow.</span>
          </h1>

          {/* Subheading */}
          <p
            className="text-lg md:text-xl text-white/75 leading-relaxed mb-10 max-w-2xl animate-slide-up"
            style={{ animationDelay: '0.2s' }}
          >
            A professional digital platform connecting civil engineers, clients, and the construction ecosystem.
            Discover verified engineers, manage construction projects, and track progress — all in one place.
          </p>

          {/* CTAs */}
          <div
            className="flex flex-col sm:flex-row gap-3 animate-slide-up"
            style={{ animationDelay: '0.3s' }}
          >
            <Link
              href="/engineers"
              id="hero-cta-find"
              className="ch-btn ch-btn-primary text-base px-6 py-3 gap-2"
            >
              <Search size={18} />
              Find an Engineer
            </Link>
            <Link
              href="/register"
              id="hero-cta-explore"
              className="ch-btn ch-btn-ghost-white text-base px-6 py-3 border border-white/20 gap-2"
            >
              Explore CivilHub
              <ArrowRight size={18} />
            </Link>
          </div>

          {/* Trust signals */}
          <div
            className="mt-12 flex flex-wrap gap-6 text-sm text-white/50 animate-fade-in"
            style={{ animationDelay: '0.5s' }}
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-ch-orange)]" />
              <span>Verified Engineers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-ch-orange)]" />
              <span>Real Project Portfolios</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-ch-orange)]" />
              <span>Live Construction Updates</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
