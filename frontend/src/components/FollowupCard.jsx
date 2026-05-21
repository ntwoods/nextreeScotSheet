import { useEffect, useState } from 'react'
import clsx from 'clsx'
import Countdown from './Countdown'
import { formatFollowupLabel, isOverdue } from '../utils/date'

export default function FollowupCard({
  followup,
  onOpen,
}) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setTick((value) => value + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const label = formatFollowupLabel(followup.followUpISO, followup.hasTime)
  const overdue = isOverdue(followup.followUpISO, followup.hasTime, tick)

  return (
    <div
      className={clsx(
        'flex h-full flex-col rounded-2xl border bg-white p-5 shadow-soft transition',
        overdue
          ? 'border-red-200 shadow-[0_10px_30px_rgba(239,68,68,0.15)]'
          : 'border-slate-200',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            {followup.dealerName}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {followup.intervalDays && (
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                {followup.intervalDays} day interval
              </span>
            )}
            {overdue && (
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600">
                Overdue
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpen(followup)}
          className={clsx(
            'rounded-full px-4 py-2 text-sm font-semibold transition',
            overdue
              ? 'bg-red-600 text-white hover:bg-red-500'
              : 'bg-brand-600 text-white hover:bg-brand-500',
          )}
        >
          {label}
        </button>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        {followup.hasTime ? (
          <Countdown iso={followup.followUpISO} />
        ) : (
          <span>All-day follow-up</span>
        )}
        <span>{followup.hasTime ? 'Time-specific' : 'Date-only'}</span>
      </div>

      <div className="mt-4">
        <p className="text-sm font-medium text-slate-700">
          {followup.latestRemark || 'No remarks yet. Add the latest outcome.'}
        </p>
      </div>
    </div>
  )
}
