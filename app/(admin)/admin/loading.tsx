export default function AdminLoading() {
  return (
    <div className="animate-pulse space-y-8" aria-busy="true" aria-label="Loading admin workspace">
      <div><div className="h-3 w-28 rounded bg-[var(--color-ch-border)] mb-3" /><div className="h-9 w-64 rounded bg-[var(--color-ch-border)] mb-3" /><div className="h-4 w-96 max-w-full rounded bg-[var(--color-ch-border-subtle)]" /></div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">{[1, 2, 3, 4].map((item) => <div key={item} className="ch-card h-40 bg-[var(--color-ch-border-subtle)]" />)}</div>
      <div className="ch-card h-28 bg-[var(--color-ch-border-subtle)]" />
    </div>
  )
}
