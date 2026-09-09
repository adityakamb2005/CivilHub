export default function OpportunityDetailLoading() {
  return (
    <div className="ch-section" aria-busy="true" aria-label="Loading opportunity">
      <div className="ch-container max-w-4xl">
        <div className="h-5 w-44 rounded bg-[var(--color-ch-border)] animate-pulse mb-8" />
        <div className="ch-card overflow-hidden">
          <div className="h-64 bg-[var(--color-ch-navy)] animate-pulse" />
          <div className="p-8 space-y-4">
            <div className="h-5 w-40 rounded bg-[var(--color-ch-border)] animate-pulse" />
            <div className="h-4 w-full rounded bg-[var(--color-ch-border)] animate-pulse" />
            <div className="h-4 w-3/4 rounded bg-[var(--color-ch-border)] animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
