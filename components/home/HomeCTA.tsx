import Link from 'next/link'
import { ArrowRight, HardHat } from 'lucide-react'

export function HomeCTA() {
  return (
    <section className="ch-section bg-[var(--color-ch-surface)]" aria-labelledby="cta-heading">
      <div className="ch-container">
        <div className="relative bg-[var(--color-ch-navy)] rounded-2xl overflow-hidden">
          {/* Background pattern */}
          <div
            className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 40px,
                rgba(255,255,255,0.5) 40px,
                rgba(255,255,255,0.5) 41px
              )`,
            }}
            aria-hidden="true"
          />

          {/* Orange accent bar */}
          <div
            className="absolute top-0 left-0 right-0 h-1 bg-[var(--color-ch-orange)]"
            aria-hidden="true"
          />

          <div className="relative z-10 text-center py-20 px-6 md:px-12">
            {/* Icon */}
            <div className="w-16 h-16 bg-[var(--color-ch-orange)] rounded-2xl flex items-center justify-center mx-auto mb-6">
              <HardHat size={28} className="text-white" />
            </div>

            <h2
              id="cta-heading"
              className="ch-text-section-heading text-white mb-4"
            >
              Ready to Join the CivilHub Community?
            </h2>

            <p className="text-white/70 max-w-xl mx-auto leading-relaxed mb-10">
              Whether you&apos;re a civil engineer looking to grow your practice or a client starting a construction project,
              CivilHub is the platform built for you.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register?role=engineer"
                id="cta-engineer-join"
                className="ch-btn ch-btn-primary text-base px-7 py-3 gap-2"
              >
                <HardHat size={18} />
                Join as Engineer
              </Link>
              <Link
                href="/register?role=client"
                id="cta-client-join"
                className="ch-btn ch-btn-ghost-white text-base px-7 py-3 border border-white/20 gap-2"
              >
                Find an Engineer
                <ArrowRight size={18} />
              </Link>
            </div>

            <p className="mt-6 text-xs text-white/40">
              Free to join. No credit card required.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
