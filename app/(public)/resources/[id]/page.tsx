import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AlertCircle, ArrowLeft, BookOpen, ExternalLink, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Resource } from '@/types'

interface ResourcePageProps {
  params: Promise<{ id: string }>
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isResourceId(value: string): boolean {
  return UUID_PATTERN.test(value)
}

function formatDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(date)
}

async function getResource(id: string) {
  const supabase = await createClient()
  return supabase
    .from('resources')
    .select('*')
    .eq('id', id)
    .maybeSingle()
}

export async function generateMetadata({ params }: ResourcePageProps): Promise<Metadata> {
  const { id } = await params
  if (!isResourceId(id)) return { title: 'Resource | CivilHub' }

  const { data } = await getResource(id)
  const resource = data as Resource | null

  return resource
    ? {
        title: `${resource.title} | CivilHub Resources`,
        description: resource.description,
      }
    : { title: 'Resource | CivilHub' }
}

export default async function ResourceDetailPage({ params }: ResourcePageProps) {
  const { id } = await params
  if (!isResourceId(id)) notFound()

  const { data, error } = await getResource(id)
  const resource = data as Resource | null

  if (error) {
    return (
      <div className="ch-section">
        <div className="ch-container max-w-4xl">
          <Link
            href="/resources"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)] transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Back to Resources
          </Link>
          <div className="ch-card p-10 sm:p-14 text-center" role="alert">
            <AlertCircle size={32} className="mx-auto mb-4 text-[var(--color-ch-red)]" />
            <h1 className="text-xl font-bold text-[var(--color-ch-navy)] mb-2">
              Resource unavailable
            </h1>
            <p className="text-sm text-[var(--color-ch-text-secondary)]">
              We could not load this resource right now. Please return to the resources library and try again.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!resource) notFound()

  const publishedDate = formatDate(resource.published_at || resource.created_at)
  const paragraphs = resource.content.split(/\n{2,}/).filter((paragraph) => paragraph.trim())

  return (
    <div className="ch-section py-8 sm:py-12">
      <div className="ch-container max-w-4xl">
        <Link
          href="/resources"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)] transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Resources
        </Link>

        <article className="ch-card overflow-hidden">
          <header className="bg-gradient-to-br from-[var(--color-ch-navy)] to-[var(--color-ch-charcoal)] px-6 py-10 sm:px-10 sm:py-14 text-white">
            <div className="flex items-center gap-2 mb-5">
              <span className="ch-badge bg-white/10 text-white border border-white/20 gap-1">
                <BookOpen size={12} />
                {resource.category}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">
              {resource.title}
            </h1>
            <p className="text-white/80 text-base sm:text-lg leading-relaxed max-w-3xl">
              {resource.description}
            </p>
          </header>

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-[var(--color-ch-text-secondary)] border-b border-[var(--color-ch-border-subtle)] pb-6 mb-8">
              {(resource.author_name || resource.source_name) && (
                <div className="flex items-center gap-2">
                  <UserRound size={16} className="text-[var(--color-ch-text-muted)]" />
                  <span>{resource.author_name || resource.source_name}</span>
                </div>
              )}
              {publishedDate && (
                <time dateTime={resource.published_at || resource.created_at}>{publishedDate}</time>
              )}
              {resource.source_name && resource.author_name && (
                <span>Source: {resource.source_name}</span>
              )}
            </div>

            <div className="space-y-5 text-[var(--color-ch-text-secondary)] leading-relaxed whitespace-pre-line">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {resource.source_url && (
              <div className="mt-10 pt-6 border-t border-[var(--color-ch-border-subtle)]">
                <a
                  href={resource.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-ch-orange)] hover:underline"
                >
                  View original source{resource.source_name ? `: ${resource.source_name}` : ''}
                  <ExternalLink size={15} />
                </a>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  )
}
