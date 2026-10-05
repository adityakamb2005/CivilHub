export function MessagingUnavailable({ migrationMissing = false }: { migrationMissing?: boolean }) {
  return (
    <div role="alert" className="ch-card mx-auto max-w-2xl p-8 text-center">
      <h1 className="text-lg font-bold text-[var(--color-ch-navy)]">
        {migrationMissing ? 'Messaging database setup is incomplete' : 'Conversation unavailable'}
      </h1>
      <p className="mt-2 text-sm text-[var(--color-ch-text-secondary)]">
        {migrationMissing
          ? 'Apply Supabase migrations 011 (messaging and notifications) and 013 (project messaging security) before using messaging.'
          : 'We could not load this conversation right now. Please refresh and try again.'}
      </p>
    </div>
  )
}
