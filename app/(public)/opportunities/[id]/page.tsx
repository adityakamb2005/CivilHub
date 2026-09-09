import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  MapPin,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import type { Opportunity } from '@/types'

interface OpportunityPageProps {
  params: Promise<{ id: string }>
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isOpportunityId(value: string): boolean {
  return UUID_PATTERN.test(value)
}

function formatDate(value: string | null): string | null {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(date)
}

async function getOpportunity(id: string) {
  const supabase = await createClient()
  return supabase
    .from('opportunities')
    .select('*')
    .eq('id', id)
    .maybeSingle()
}

export async function generateMetadata({ params }: OpportunityPageProps): Promise<Metadata> {
  const { id } = await params
  if (!isOpportunityId(id)) return { title: 'Opportunity | CivilHub' }

  const { data } = await getOpportunity(id)
  const opportunity = data as Opportunity | null

  return opportunity
    ? {
        title: `${opportunity.title} | CivilHub Opportunities`,
        description: opportunity.description,
      }
    : { title: 'Opportunity | CivilHub' }
}

export default async function OpportunityDetailPage({ params }: OpportunityPageProps) {
  const { id } = await params
  if (!isOpportunityId(id)) notFound()

  const { data, error } = await getOpportunity(id)
  const opportunity = data as Opportunity | null

  if (error) {
    return (
      <div className="ch-section">
        <div className="ch-container max-w-4xl">
          <Link
            href="/opportunities"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)] transition-colors mb-8"
          >
            <ArrowLeft size={16} />
            Back to Opportunities
          </Link>
          <div className="ch-card p-10 sm:p-14 text-center" role="alert">
            <AlertCircle size={32} className="mx-auto mb-4 text-[var(--color-ch-red)]" />
            <h1 className="text-xl font-bold text-[var(--color-ch-navy)] mb-2">
              Opportunity unavailable
            </h1>
            <p className="text-sm text-[var(--color-ch-text-secondary)]">
              We could not load this opportunity right now. Please return to the opportunity board and try again.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!opportunity) notFound()

  const deadline = formatDate(opportunity.deadline)

  return (
    <div className="ch-section py-8 sm:py-12">
      <div className="ch-container max-w-4xl">
        <Link
          href="/opportunities"
          className="inline-flex items-center gap-2 text-sm text-[var(--color-ch-text-secondary)] hover:text-[var(--color-ch-navy)] transition-colors mb-8"
        >
          <ArrowLeft size={16} />
          Back to Opportunities
        </Link>

        <article className="ch-card overflow-hidden">
          <header className="bg-gradient-to-br from-[var(--color-ch-navy)] to-[var(--color-ch-charcoal)] px-6 py-10 sm:px-10 sm:py-14 text-white">
            <div className="flex flex-wrap items-center gap-2 mb-5">
              <span className="ch-badge bg-white/10 text-white border border-white/20 gap-1">
                <Briefcase size={12} />
                {opportunity.opportunity_type}
              </span>
              <span className="ch-badge bg-[var(--color-ch-green)] text-white">Open</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight mb-4">
              {opportunity.title}
            </h1>
            {opportunity.organization_name && (
              <p className="text-white/80 text-base sm:text-lg">
                {opportunity.organization_name}
              </p>
            )}
          </header>

          <div className="px-6 py-8 sm:px-10 sm:py-10">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
              {opportunity.organization_name && (
                <div className="p-4 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-ch-text-muted)] mb-1">
                    <Building2 size={14} />
                    Organization / Client
                  </div>
                  <div className="font-semibold text-sm text-[var(--color-ch-navy)]">
                    {opportunity.organization_name}
                  </div>
                </div>
              )}
              {opportunity.location && (
                <div className="p-4 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-ch-text-muted)] mb-1">
                    <MapPin size={14} />
                    Location
                  </div>
                  <div className="font-semibold text-sm text-[var(--color-ch-navy)]">
                    {opportunity.location}
                  </div>
                </div>
              )}
              {deadline && (
                <div className="p-4 rounded-lg bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)]">
                  <div className="flex items-center gap-2 text-xs text-[var(--color-ch-text-muted)] mb-1">
                    <CalendarDays size={14} />
                    Deadline
                  </div>
                  <time dateTime={opportunity.deadline || undefined} className="font-semibold text-sm text-[var(--color-ch-navy)]">
                    {deadline}
                  </time>
                </div>
              )}
            </div>

            <div className="border-t border-[var(--color-ch-border-subtle)] pt-8">
              <h2 className="text-lg font-bold text-[var(--color-ch-navy)] mb-4">
                Opportunity details
              </h2>
              <p className="text-[var(--color-ch-text-secondary)] leading-relaxed whitespace-pre-line">
                {opportunity.description}
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
