import Link from 'next/link'
import { Clock, Tag, ArrowRight } from 'lucide-react'

const RESOURCES = [
  {
    id: 'demo-r1',
    category: 'Engineering Fundamentals',
    title: 'Understanding Load Distribution in RCC Structures',
    excerpt:
      'A practical introduction to how loads travel through reinforced concrete frames, beams, and columns to the foundation.',
    readTime: '6 min read',
    href: '/resources/demo-r1',
    tag: 'Structural',
    tagColor: 'ch-badge-navy',
  },
  {
    id: 'demo-r2',
    category: 'Construction Management',
    title: 'How to Set Up a Construction Project Schedule',
    excerpt:
      'Step-by-step guidance on creating a realistic construction timeline that keeps engineers and clients aligned.',
    readTime: '8 min read',
    href: '/resources/demo-r2',
    tag: 'Management',
    tagColor: 'ch-badge-orange',
  },
  {
    id: 'demo-r3',
    category: 'Career',
    title: 'Building Your Engineering Portfolio — What Clients Actually Look For',
    excerpt:
      'How to present your civil engineering portfolio to win client trust and stand out in a competitive market.',
    readTime: '5 min read',
    href: '/resources/demo-r3',
    tag: 'Career',
    tagColor: 'ch-badge-green',
  },
]

export function ResourcesPreview() {
  return (
    <section className="ch-section bg-[var(--color-ch-surface)]" aria-labelledby="resources-heading">
      <div className="ch-container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <span className="ch-section-label mb-3 block">Resources</span>
            <h2
              id="resources-heading"
              className="ch-text-section-heading text-[var(--color-ch-navy)]"
            >
              Knowledge for the Modern Engineer
            </h2>
          </div>
          <Link
            href="/resources"
            className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-ch-orange)] hover:underline whitespace-nowrap"
          >
            All resources
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* Demo notice */}
        <p className="text-xs text-[var(--color-ch-text-muted)] mb-6 italic">
          * Sample resources shown for demonstration.
        </p>

        {/* Resource cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {RESOURCES.map((resource) => (
            <Link
              key={resource.id}
              href={resource.href}
              className="ch-card p-6 hover:shadow-[0_4px_16px_0_rgb(15_28_46/0.10)] transition-all duration-200 hover:-translate-y-0.5 flex flex-col group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-medium text-[var(--color-ch-text-muted)]">
                  {resource.category}
                </span>
                <span className={`ch-badge ${resource.tagColor}`}>
                  <Tag size={9} className="mr-1" />
                  {resource.tag}
                </span>
              </div>

              <h3 className="font-semibold text-[var(--color-ch-navy)] mb-2 leading-snug group-hover:text-[var(--color-ch-orange)] transition-colors">
                {resource.title}
              </h3>

              <p className="text-sm text-[var(--color-ch-text-secondary)] leading-relaxed flex-1 mb-4">
                {resource.excerpt}
              </p>

              <div className="flex items-center gap-1.5 text-xs text-[var(--color-ch-text-muted)]">
                <Clock size={11} />
                <span>{resource.readTime}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
