import Link from 'next/link'
import { ArrowRight, BookOpen, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Resource } from '@/types'

export async function ResourcesPreview() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('resources')
    .select('*')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(3)

  const resources = (data || []) as Resource[]

  return (
    <section className="ch-section bg-[var(--color-ch-surface)]" aria-labelledby="resources-heading">
      <div className="ch-container">
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

        {resources.length === 0 ? (
          <div className="ch-card p-8 sm:p-10 text-center flex flex-col items-center">
            <BookOpen size={30} className="text-[var(--color-ch-text-muted)] mb-4" />
            <h3 className="font-semibold text-[var(--color-ch-navy)] mb-2">
              No resources published yet
            </h3>
            <p className="text-sm text-[var(--color-ch-text-secondary)] max-w-md">
              Published engineering articles, formulas, and practical references will appear here as they become available.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resources.map((resource) => (
              <Link
                key={resource.id}
                href={`/resources/${resource.id}`}
                className="ch-card p-6 hover:shadow-[0_4px_16px_0_rgb(15_28_46/0.10)] transition-all duration-200 hover:-translate-y-0.5 flex flex-col group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="ch-badge ch-badge-orange gap-1 max-w-full truncate">
                    <Tag size={11} />
                    {resource.category}
                  </span>
                </div>

                <h3 className="font-semibold text-[var(--color-ch-navy)] mb-2 leading-snug group-hover:text-[var(--color-ch-orange)] transition-colors">
                  {resource.title}
                </h3>

                <p className="text-sm text-[var(--color-ch-text-secondary)] leading-relaxed line-clamp-3 flex-1 mb-4">
                  {resource.description}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-[var(--color-ch-orange)] font-medium">
                  Read resource
                  <ArrowRight size={14} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
