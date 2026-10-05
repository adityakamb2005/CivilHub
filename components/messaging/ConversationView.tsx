'use client'

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, FolderKanban, CheckCheck, Loader2, AlertCircle } from 'lucide-react'
import { sendMessage, markConversationMessagesAsRead } from '@/lib/messaging/messagingActions'

export interface MessageItem {
  id: string
  conversation_id: string
  sender_profile_id: string
  sender_name: string
  body: string
  created_at: string
  read_at: string | null
}

export function ConversationView({
  conversationId,
  projectId,
  projectTitle,
  participantName,
  participantRole,
  currentUserId,
  role,
  initialMessages,
}: {
  conversationId: string
  projectId: string
  projectTitle: string
  participantName: string
  participantRole: string
  currentUserId: string
  role: 'client' | 'engineer'
  initialMessages: MessageItem[]
}) {
  const [messages, setMessages] = useState<MessageItem[]>(initialMessages)
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const backPath = role === 'client' ? '/client/messages' : '/engineer/messages'
  const projectPath = role === 'client' ? `/client/projects/${projectId}` : `/projects/${projectId}`

  // Mark unread messages as read upon entering conversation
  useEffect(() => {
    startTransition(() => {
      markConversationMessagesAsRead(conversationId)
    })
  }, [conversationId])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const body = text.trim()
    if (!body) return

    startTransition(async () => {
      const res = await sendMessage(conversationId, body)
      if (res.error) {
        setError(res.error)
      } else {
        setText('')
        // Optimistically add message
        setMessages((prev) => [
          ...prev,
          {
            id: `temp-${Date.now()}`,
            conversation_id: conversationId,
            sender_profile_id: currentUserId,
            sender_name: 'You',
            body,
            created_at: new Date().toISOString(),
            read_at: null,
          },
        ])
      }
    })
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div>
        <Link
          href={backPath}
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-ch-orange)] hover:underline mb-3 font-medium"
        >
          <ArrowLeft size={14} /> Back to Messages Inbox
        </Link>

        <div className="ch-card min-w-0 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-l-[var(--color-ch-orange)]">
          <div className="flex min-w-0 items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[var(--color-ch-navy)] text-white font-bold flex items-center justify-center shrink-0">
              {participantName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="break-words font-bold text-base text-[var(--color-ch-navy)]">
                  {participantName}
                </h1>
                <span className="ch-badge bg-slate-100 text-slate-700 text-xs">
                  {participantRole}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-ch-text-secondary)] mt-0.5">
                <FolderKanban size={13} className="text-[var(--color-ch-orange)] shrink-0" />
                <span className="min-w-0 break-words font-medium">{projectTitle}</span>
              </div>
            </div>
          </div>

          <Link
            href={projectPath}
            target="_blank"
            className="ch-btn ch-btn-outline text-xs px-3 py-1.5 self-start sm:self-auto shrink-0"
          >
            View Project Details
          </Link>
        </div>
      </div>

      {/* Messages Thread Box */}
      <div className="ch-card p-6 min-h-[360px] flex flex-col justify-between space-y-6">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[var(--color-ch-text-muted)] space-y-2">
            <FolderKanban size={28} className="opacity-40" />
            <p className="text-sm font-semibold text-[var(--color-ch-navy)]">Start the conversation</p>
            <p className="text-xs text-[var(--color-ch-text-secondary)] max-w-sm">
              Send a message to discuss project specifications, scheduling, or technical requirements.
            </p>
          </div>
        ) : (
          <div className="space-y-4 flex-1 overflow-y-auto max-h-[500px] pr-1">
            {messages.map((msg) => {
              const isSelf = msg.sender_profile_id === currentUserId
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-[var(--color-ch-text-muted)] mb-1">
                    <span className="font-semibold">{isSelf ? 'You' : participantName}</span>
                    <span>·</span>
                    <span>
                      {new Date(msg.created_at).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl max-w-[min(32rem,85%)] break-words text-xs leading-relaxed whitespace-pre-line ${
                      isSelf
                        ? 'bg-[var(--color-ch-navy)] text-white rounded-tr-none'
                        : 'bg-[var(--color-ch-surface)] text-[var(--color-ch-navy)] border border-[var(--color-ch-border)] rounded-tl-none'
                    }`}
                  >
                    {msg.body}
                  </div>

                  {isSelf && (
                    <div className="flex items-center gap-1 text-[10px] text-[var(--color-ch-text-muted)] mt-1">
                      {msg.read_at ? (
                        <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                          <CheckCheck size={12} /> Read
                        </span>
                      ) : (
                        <span>Sent</span>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Message Composer */}
        <form onSubmit={handleSend} className="pt-4 border-t border-[var(--color-ch-border)] space-y-3">
          {error && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-[var(--color-ch-red-light)] border border-[var(--color-ch-red)]/20 text-xs text-[var(--color-ch-red)] flex items-center gap-2"
            >
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-end gap-3">
            <textarea
              rows={3}
              required
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your message here…"
              className="ch-input flex-1 resize-y text-xs"
              maxLength={2000}
            />
            <button
              type="submit"
              disabled={isPending || !text.trim()}
              className="ch-btn ch-btn-primary h-10 px-4 inline-flex items-center gap-1.5 text-xs font-semibold shrink-0 disabled:opacity-50"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Send
            </button>
          </div>
          <span className="text-[11px] text-[var(--color-ch-text-muted)] block text-right">
            {text.length} / 2000 characters
          </span>
        </form>
      </div>
    </div>
  )
}
