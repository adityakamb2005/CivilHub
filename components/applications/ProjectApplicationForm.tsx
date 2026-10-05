'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { Send, CheckCircle2, AlertCircle, Clock, XCircle, LogIn, Lock } from 'lucide-react'
import { submitProjectApplication, type ApplicationActionState } from '@/lib/applications/projectActions'
import type { ProjectApplication } from '@/types'
import { ApplicationStatusBadge } from './ApplicationStatusBadge'
import { WithdrawProjectApplicationButton } from './WithdrawProjectApplicationButton'
import { AdminSubmitButton } from '@/components/admin/AdminSubmitButton'

const initialState: ApplicationActionState = {}

export function ProjectApplicationForm({
  projectId,
  isEligible,
  userRole,
  existingApplication,
}: {
  projectId: string
  isEligible: boolean
  userRole: 'engineer' | 'client' | 'admin' | null
  existingApplication: ProjectApplication | null
}) {
  const [state, formAction] = useActionState(submitProjectApplication, initialState)

  // 1. Unauthenticated Visitor
  if (!userRole) {
    return (
      <div className="ch-card p-6 bg-gradient-to-br from-[var(--color-ch-navy)] to-[var(--color-ch-charcoal)] text-white space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--color-ch-orange)] flex items-center justify-center text-white shrink-0">
            <Lock size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Are you a Civil Engineer?</h3>
            <p className="text-xs text-white/70">
              Sign in to your engineer account to submit an application for this project.
            </p>
          </div>
        </div>
        {isEligible ? (
          <Link
            href={`/login?redirect=/projects/${projectId}`}
            className="ch-btn ch-btn-primary w-full justify-center inline-flex items-center gap-2 text-sm"
          >
            <LogIn size={16} /> Sign In to Apply
          </Link>
        ) : (
          <p className="text-xs text-white/50 italic">
            Applications for this project are currently closed.
          </p>
        )}
      </div>
    )
  }

  // 2. Authenticated Client
  if (userRole === 'client') {
    return (
      <div className="ch-card p-6 bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] space-y-2">
        <h3 className="font-bold text-sm text-[var(--color-ch-navy)]">Client Account Detected</h3>
        <p className="text-xs text-[var(--color-ch-text-secondary)] leading-relaxed">
          You are currently signed in as a Client. Project applications are reserved for registered civil engineers.
        </p>
      </div>
    )
  }

  // 3. Existing Application Submitted by Engineer
  if (existingApplication) {
    return (
      <div className="ch-card p-6 space-y-5 border-t-4 border-t-[var(--color-ch-navy)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ch-text-muted)]">
              Your Application Status
            </span>
            <h3 className="text-lg font-bold text-[var(--color-ch-navy)] mt-0.5">
              Application Submitted
            </h3>
          </div>
          <ApplicationStatusBadge status={existingApplication.status} />
        </div>

        {existingApplication.status === 'pending' && (
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs flex items-start gap-2.5">
            <Clock size={16} className="shrink-0 mt-0.5 text-blue-600" />
            <div>
              <span className="font-semibold">Under Client Review:</span> Your application has been received by the project client. You will be notified if your profile is selected.
            </div>
          </div>
        )}

        {existingApplication.status === 'accepted' && (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
            <CheckCircle2 size={16} className="shrink-0 mt-0.5 text-emerald-600" />
            <div>
              <span className="font-semibold">Application Accepted!</span> The project owner has selected your engineer profile for this project.
            </div>
          </div>
        )}

        {existingApplication.status === 'rejected' && (
          <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <XCircle size={16} className="shrink-0 mt-0.5 text-rose-600" />
            <div>
              <span className="font-semibold">Not Selected:</span> The project owner selected another engineer or closed applications for this project.
            </div>
          </div>
        )}

        {existingApplication.status === 'withdrawn' && (
          <div className="p-4 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs">
            You withdrew your application for this project.
          </div>
        )}

        <div className="space-y-2 border-t border-[var(--color-ch-border-subtle)] pt-4">
          <span className="text-xs font-semibold text-[var(--color-ch-navy)] block">
            Cover Message Submitted:
          </span>
          <p className="text-xs text-[var(--color-ch-text-secondary)] whitespace-pre-line bg-[var(--color-ch-surface)] p-3.5 rounded-lg border border-[var(--color-ch-border-subtle)]">
            {existingApplication.cover_message}
          </p>
          <span className="text-[11px] text-[var(--color-ch-text-muted)] block">
            Submitted on {new Date(existingApplication.created_at).toLocaleDateString('en-US')}
          </span>
        </div>

        {existingApplication.status === 'pending' && (
          <div className="pt-2 flex justify-end">
            <WithdrawProjectApplicationButton
              applicationId={existingApplication.id}
              projectId={projectId}
            />
          </div>
        )}
      </div>
    )
  }

  // 4. Ineligible Project (Closed / Assigned)
  if (!isEligible) {
    return (
      <div className="ch-card p-6 bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] space-y-2">
        <h3 className="font-bold text-sm text-[var(--color-ch-navy)]">Applications Closed</h3>
        <p className="text-xs text-[var(--color-ch-text-secondary)] leading-relaxed">
          This project is no longer accepting new engineer applications.
        </p>
      </div>
    )
  }

  // 5. Eligible Project — Application Form
  return (
    <div className="ch-card p-6 space-y-5">
      <div className="border-b border-[var(--color-ch-border)] pb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-ch-orange)]">
          Engineer Application
        </span>
        <h3 className="text-lg font-bold text-[var(--color-ch-navy)] mt-0.5">
          Apply to Work on this Project
        </h3>
        <p className="text-xs text-[var(--color-ch-text-secondary)] mt-1">
          Submit your application and proposal details to the project client.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="project_id" value={projectId} />

        {state.error && (
          <div
            role="alert"
            className="p-3.5 rounded-lg bg-[var(--color-ch-red-light)] border border-[var(--color-ch-red)]/20 text-xs text-[var(--color-ch-red)] flex items-start gap-2"
          >
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>{state.error}</span>
          </div>
        )}

        {state.success && (
          <div
            role="status"
            className="p-3.5 rounded-lg bg-[var(--color-ch-green-light)] border border-[var(--color-ch-green)]/20 text-xs text-[var(--color-ch-green)] flex items-start gap-2"
          >
            <CheckCircle2 size={15} className="shrink-0 mt-0.5" />
            <span>{state.success}</span>
          </div>
        )}

        <div>
          <label htmlFor="cover_message" className="ch-text-label">
            Cover Message / Qualifications <span className="text-[var(--color-ch-red)]">*</span>
          </label>
          <textarea
            id="cover_message"
            name="cover_message"
            required
            rows={5}
            placeholder="Describe your relevant civil engineering experience, licensing, and approach for this project..."
            className="ch-input mt-1.5 resize-y text-xs"
          />
          <span className="text-[11px] text-[var(--color-ch-text-muted)] mt-1 block">
            Minimum 20 characters. Highlight relevant technical skills and capacity.
          </span>
        </div>

        <div className="pt-2 flex items-center justify-end gap-3">
          <AdminSubmitButton label="Submit Application" />
        </div>
      </form>
    </div>
  )
}
