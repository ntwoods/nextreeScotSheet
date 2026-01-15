export default function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="h-4 w-1/2 rounded bg-slate-200" />
      <div className="mt-3 h-3 w-1/4 rounded bg-slate-200" />
      <div className="mt-6 h-10 w-32 rounded bg-slate-200" />
      <div className="mt-6 h-3 w-full rounded bg-slate-200" />
      <div className="mt-2 h-3 w-3/4 rounded bg-slate-200" />
    </div>
  )
}