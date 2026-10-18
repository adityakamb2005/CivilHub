'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Bell, Check, CheckCheck, ExternalLink, Inbox, Loader2 } from 'lucide-react'
import { markNotificationRead, markAllNotificationsRead } from '@/lib/notifications/notificationActions'

export interface NotificationItem {
  id: string
  profile_id: string
  type: string
  title: string
  body: string | null
  link?: string | null
  is_read: boolean
  created_at: string
}

export function NotificationsView({
  notifications,
  role,
  loadError = false,
}: {
  notifications: NotificationItem[]
  role: 'client' | 'engineer'
  loadError?: boolean
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleMarkOne = (id: string) => {
    startTransition(async () => {
      setError(null)
      const result = await markNotificationRead(id)
      setError(result.error || null)
    })
  }

  const handleMarkAll = () => {
    startTransition(async () => {
      setError(null)
      const result = await markAllNotificationsRead()
      setError(result.error || null)
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-ch-border)] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ch-navy)] flex items-center gap-2.5">
            <Bell className="w-7 h-7 text-[var(--color-ch-orange)]" />
            Notifications
          </h1>
          <p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">
            Stay updated on project applications, selections, and new messages.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            disabled={isPending}
            onClick={handleMarkAll}
            className="ch-btn ch-btn-outline text-xs px-3.5 py-2 inline-flex items-center gap-1.5 self-start sm:self-auto shrink-0 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
          >
            {isPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={14} />}
            Mark All as Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Empty State */}
      {(loadError || error) && <div role="alert" className="ch-card p-5 text-sm text-[var(--color-ch-red)]">{loadError ? 'Notifications could not be loaded. Please refresh the page to try again.' : error}</div>}
      {loadError ? null : notifications.length === 0 ? (
        <div className="ch-card p-12 text-center max-w-xl mx-auto space-y-4 my-8">
          <div className="w-14 h-14 rounded-full bg-[var(--color-ch-surface)] border border-[var(--color-ch-border)] text-[var(--color-ch-text-muted)] flex items-center justify-center mx-auto">
            <Inbox size={28} />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)]">No notifications yet</h2>
          <p className="text-sm text-[var(--color-ch-text-secondary)]">
            You will receive in-app notifications here when applications are updated or messages arrive.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`ch-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                !n.is_read
                  ? 'bg-emerald-50/20 border-l-4 border-l-emerald-500'
                  : 'border-[var(--color-ch-border)] opacity-80'
              }`}
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-sm text-[var(--color-ch-navy)]">
                    {n.title}
                  </h3>
                  {!n.is_read && (
                    <span className="ch-badge bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      New
                    </span>
                  )}
                </div>

                {n.body && (
                  <p className="text-xs text-[var(--color-ch-text-secondary)] leading-relaxed">
                    {n.body}
                  </p>
                )}

                <span className="text-[11px] text-[var(--color-ch-text-muted)] block">
                  {new Date(n.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto pt-2 sm:pt-0">
                {n.link && (
                  <Link
                    href={n.link}
                    onClick={() => {
                      if (!n.is_read) handleMarkOne(n.id)
                    }}
                    className="ch-btn ch-btn-primary text-xs px-3 py-1.5 inline-flex items-center gap-1 font-medium"
                  >
                    View <ExternalLink size={12} />
                  </Link>
                )}

                {!n.is_read && (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleMarkOne(n.id)}
                    className="ch-btn ch-btn-ghost text-xs px-2.5 py-1.5 text-[var(--color-ch-text-muted)] hover:text-emerald-700 inline-flex items-center gap-1"
                    title="Mark as read"
                  >
                    <Check size={14} />
                    <span className="hidden sm:inline">Mark read</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
