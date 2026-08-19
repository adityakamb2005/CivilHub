import Link from 'next/link'
import { MapPin, Star, BadgeCheck, ArrowRight } from 'lucide-react'

// Demo data — clearly marked as sample/demo
const FEATURED_ENGINEERS = [
  {
    id: 'demo-1',
    name: 'Aravind Krishnamurthy',
    headline: 'Senior Structural Engineer',
    location: 'Bengaluru, Karnataka',
    experience: '14 years',
    rating: 4.9,
    reviews: 23,
    isVerified: true,
    specializations: ['Structural Design', 'RCC Construction', 'Steel Structures'],
    avatarInitials: 'AK',
    avatarColor: 'bg-[var(--color-ch-navy)]',
    projectsCompleted: 38,
  },
  {
    id: 'demo-2',
    name: 'Priya Subramaniam',
    headline: 'Civil & Infrastructure Engineer',
    location: 'Chennai, Tamil Nadu',
    experience: '9 years',
    rating: 4.8,
    reviews: 17,
    isVerified: true,
    specializations: ['Road Construction', 'Drainage Systems', 'Site Supervision'],
    avatarInitials: 'PS',
    avatarColor: 'bg-[var(--color-ch-charcoal)]',
    projectsCompleted: 21,
  },
  {
    id: 'demo-3',
    name: 'Mohammed Iqbal Siddiqui',
    headline: 'Geotechnical & Foundation Engineer',
    location: 'Hyderabad, Telangana',
    experience: '11 years',
    rating: 4.7,
    reviews: 14,
    isVerified: false,
    specializations: ['Foundation Engineering', 'Soil Testing', 'Retaining Walls'],
    avatarInitials: 'MI',
    avatarColor: 'bg-[var(--color-ch-orange)]',
    projectsCompleted: 29,
  },
]

export function FeaturedEngineers() {
  return (
    <section className="ch-section bg-[var(--color-ch-surface)]" aria-labelledby="engineers-heading">
      <div className="ch-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="ch-section-label mb-3 block">Featured Engineers</span>
            <h2
              id="engineers-heading"
              className="ch-text-section-heading text-[var(--color-ch-navy)]"
            >
              Meet the Professionals
            </h2>
          </div>
          <Link
            href="/engineers"
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-ch-orange)] hover:underline whitespace-nowrap"
          >
            View all engineers
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Demo data notice */}
        <p className="text-xs text-[var(--color-ch-text-muted)] mb-6 italic">
          * Sample engineers shown for demonstration. Real engineer profiles will appear here once engineers register.
        </p>

        {/* Engineer cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURED_ENGINEERS.map((engineer) => (
            <div
              key={engineer.id}
              className="ch-card p-6 hover:shadow-[0_4px_20px_0_rgb(15_28_46/0.10)] transition-all duration-200 hover:-translate-y-0.5 flex flex-col"
            >
              {/* Top row */}
              <div className="flex items-start gap-4 mb-4">
                {/* Avatar */}
                <div
                  className={`w-14 h-14 rounded-xl ${engineer.avatarColor} flex items-center justify-center text-white font-bold text-base shrink-0`}
                  aria-hidden="true"
                >
                  {engineer.avatarInitials}
                </div>

                {/* Name + headline */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h3 className="font-semibold text-[var(--color-ch-navy)] text-sm truncate">
                      {engineer.name}
                    </h3>
                    {engineer.isVerified && (
                      <BadgeCheck
                        size={15}
                        className="text-[var(--color-ch-orange)] shrink-0"
                        aria-label="Verified engineer"
                      />
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-ch-text-secondary)] truncate">
                    {engineer.headline}
                  </p>
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-[var(--color-ch-text-muted)]">
                    <MapPin size={11} />
                    <span>{engineer.location}</span>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 py-3 border-y border-[var(--color-ch-border)]">
                <div>
                  <div className="flex items-center gap-1">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-sm font-semibold text-[var(--color-ch-navy)]">
                      {engineer.rating}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--color-ch-text-muted)]">
                    {engineer.reviews} reviews
                  </span>
                </div>
                <div className="w-px h-8 bg-[var(--color-ch-border)]" />
                <div>
                  <div className="text-sm font-semibold text-[var(--color-ch-navy)]">
                    {engineer.experience}
                  </div>
                  <span className="text-xs text-[var(--color-ch-text-muted)]">Experience</span>
                </div>
                <div className="w-px h-8 bg-[var(--color-ch-border)]" />
                <div>
                  <div className="text-sm font-semibold text-[var(--color-ch-navy)]">
                    {engineer.projectsCompleted}
                  </div>
                  <span className="text-xs text-[var(--color-ch-text-muted)]">Projects</span>
                </div>
              </div>

              {/* Specializations */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                {engineer.specializations.map((spec) => (
                  <span key={spec} className="ch-badge ch-badge-navy text-xs">
                    {spec}
                  </span>
                ))}
              </div>

              {/* Action */}
              <Link
                href={`/engineers/${engineer.id}`}
                className="ch-btn ch-btn-outline w-full justify-center mt-auto text-sm"
              >
                View Profile
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
