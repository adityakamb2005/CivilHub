export default function ResourcesLoading() {
  return (
    <div className="ch-section" aria-busy="true" aria-label="Loading resources">
      <div className="ch-container">
        <div className="mb-10 space-y-3">
          <div className="h-3 w-24 rounded bg-[var(--color-ch-border)] animate-pulse" />
          <div className="h-10 w-80 max-w-full rounded bg-[var(--color-ch-border)] animate-pulse" />
          <div className="h-5 w-full max-w-xl rounded bg-[var(--color-ch-border)] animate-pulse" />
        </div>
        <div className="h-11 w-full max-w-lg rounded bg-[var(--color-ch-border)] animate-pulse mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((item) => (
            <div key={item} className="ch-card p-6 space-y-4">
              <div className="h-5 w-28 rounded bg-[var(--color-ch-border)] animate-pulse" />
              <div className="h-6 w-full rounded bg-[var(--color-ch-border)] animate-pulse" />
              <div className="h-16 w-full rounded bg-[var(--color-ch-border)] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
