export default function EngineerProjectsLoading() {
  return (
    <section className="mx-auto max-w-5xl animate-pulse space-y-6" aria-label="Loading engineer projects">
      <div className="space-y-2">
        <div className="h-3 w-36 rounded bg-slate-200" />
        <div className="h-8 w-56 rounded bg-slate-200" />
        <div className="h-4 w-96 max-w-full rounded bg-slate-200" />
      </div>
      {[0, 1].map((section) => (
        <div key={section} className="ch-card space-y-4 p-6">
          <div className="h-6 w-48 rounded bg-slate-200" />
          {[0, 1].map((row) => <div key={row} className="h-24 rounded-lg border border-slate-200 bg-slate-50" />)}
        </div>
      ))}
    </section>
  )
}
