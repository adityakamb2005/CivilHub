'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { MessageSquare, Search, FolderKanban, Clock, ArrowRight } from 'lucide-react'

export interface ConversationItem {
  id: string
  project_id: string
  project_title: string
  participant_name: string
  participant_role: string
  participant_avatar?: string | null
  last_message?: string | null
  last_message_at: string
  unread_count: number
}

export function InboxView({
  conversations,
  role,
  loadError,
}: {
  conversations: ConversationItem[]
  role: 'client' | 'engineer'
  loadError?: 'migration' | 'generic' | null
}) {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredConversations = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter(
      (c) =>
        c.project_title.toLowerCase().includes(q) ||
        c.participant_name.toLowerCase().includes(q) ||
        (c.last_message && c.last_message.toLowerCase().includes(q))
    )
  }, [conversations, searchTerm])

  const basePath = role === 'client' ? '/client/messages' : '/engineer/messages'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--color-ch-border)] pb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-ch-navy)] flex items-center gap-2.5">
            <MessageSquare className="w-7 h-7 text-[var(--color-ch-orange)]" />
            Messages & Conversations
          </h1>
          <p className="text-sm text-[var(--color-ch-text-secondary)] mt-1">
            Direct secure communication between clients and engineers for project applications and assignments.
          </p>
        </div>
      </div>

      {loadError && (
        <div role="alert" className="ch-card p-6 text-sm text-[var(--color-ch-red)]">
          <h2 className="font-bold">{loadError === 'migration' ? 'Messaging database setup is incomplete' : 'Conversations could not be loaded'}</h2>
          <p className="mt-2 text-[var(--color-ch-text-secondary)]">
            {loadError === 'migration'
              ? 'Apply Supabase migrations 011 (messaging and notifications) and 013 (project messaging security) before using messaging.'
              : 'Please refresh and try again. If the problem continues, contact the CivilHub administrator.'}
          </p>
        </div>
      )}

      {/* Search Filter */}
      {!loadError && conversations.length > 0 && (
        <div className="relative max-w-md">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ch-text-muted)]"
          />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search conversations by project or name…"
            className="ch-input pl-10 h-10 text-xs"
          />
        </div>
      )}

      {/* Empty State */}
      {loadError ? null : conversations.length === 0 ? (
        <div className="ch-card p-12 text-center max-w-xl mx-auto space-y-4 my-8">
          <div className="w-14 h-14 rounded-full bg-[var(--color-ch-orange)]/10 text-[var(--color-ch-orange)] flex items-center justify-center mx-auto">
            <MessageSquare size={28} />
          </div>
          <h2 className="text-lg font-bold text-[var(--color-ch-navy)]">No conversations yet</h2>
          <p className="text-sm text-[var(--color-ch-text-secondary)]">
            {role === 'client'
              ? 'Conversations will appear here when engineers submit applications for your civil projects.'
              : 'Conversations will appear here when you apply to client projects or get assigned.'}
          </p>
          <Link
            href={role === 'client' ? '/client/projects' : '/projects'}
            className="ch-btn ch-btn-primary text-xs inline-flex items-center gap-1.5"
          >
            {role === 'client' ? 'View My Projects' : 'Browse Project Directory'}
          </Link>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="ch-card p-8 text-center text-sm text-[var(--color-ch-text-secondary)]">
          No conversations match your search.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredConversations.map((conv) => (
            <Link
              key={conv.id}
              href={`${basePath}/${conv.id}`}
              className={`ch-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-[var(--color-ch-orange)]/50 group ${
                conv.unread_count > 0 ? 'bg-amber-50/20 border-l-4 border-l-[var(--color-ch-orange)]' : ''
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-full bg-[var(--color-ch-navy)] text-white font-bold flex items-center justify-center shrink-0">
                  {conv.participant_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-sm text-[var(--color-ch-navy)] group-hover:text-[var(--color-ch-orange)] transition-colors truncate">
                      {conv.participant_name}
                    </h3>
                    <span className="ch-badge bg-slate-100 text-slate-600 text-[11px]">
                      {conv.participant_role}
                    </span>
                    {conv.unread_count > 0 && (
                      <span className="ch-badge bg-[var(--color-ch-orange)] text-white text-[11px] font-bold">
                        {conv.unread_count} new
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-ch-text-muted)] font-medium">
                    <FolderKanban size={13} className="shrink-0 text-[var(--color-ch-orange)]" />
                    <span className="truncate">{conv.project_title}</span>
                  </div>

                  <p className="text-xs text-[var(--color-ch-text-secondary)] truncate pt-0.5">
                    {conv.last_message || 'No messages sent yet.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 text-xs text-[var(--color-ch-text-muted)] pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--color-ch-border-subtle)]">
                <span className="inline-flex items-center gap-1">
                  <Clock size={13} />
                  {new Date(conv.last_message_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <ArrowRight size={16} className="text-[var(--color-ch-text-muted)] group-hover:text-[var(--color-ch-orange)] transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
