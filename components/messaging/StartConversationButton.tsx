'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Loader2 } from 'lucide-react'
import { getOrCreateConversation } from '@/lib/messaging/messagingActions'

export function StartConversationButton({
  projectId,
  engineerProfileId,
  userRole,
}: {
  projectId: string
  engineerProfileId: string
  userRole: 'client' | 'engineer'
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleStart = () => {
    startTransition(async () => {
      const res = await getOrCreateConversation(projectId, engineerProfileId)
      if (res.conversationId) {
        const dest = userRole === 'client'
          ? `/client/messages/${res.conversationId}`
          : `/engineer/messages/${res.conversationId}`
        router.push(dest)
      } else if (res.error) {
        alert(res.error)
      }
    })
  }

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={handleStart}
      className="ch-btn ch-btn-outline text-xs px-3 py-1.5 inline-flex items-center gap-1.5 text-[var(--color-ch-navy)] hover:bg-[var(--color-ch-surface)]"
    >
      {isPending ? <Loader2 size={13} className="animate-spin" /> : <MessageSquare size={13} />}
      Send Message
    </button>
  )
}
