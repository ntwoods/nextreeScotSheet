import { useEffect, useState } from 'react'
import clsx from 'clsx'
import { formatInTimeZone } from 'date-fns-tz'
import { parseISO } from 'date-fns'
import Countdown from './Countdown'
import { formatFollowupLabel, isOverdue, TIMEZONE } from '../utils/date'

export default function FollowupCard({
  followup,
  remarks,
  remarksLoading,
  onLoadRemarks,
  onOpen,
}) {
  const [expanded, setExpanded] = useState(false)
  const [overdue, setOverdue] = useState(() =>
    isOverdue(followup.followUpISO, followup.hasTime),
  )

  useEffect(() => {
    setOverdue(isOverdue(followup.followUpISO, followup.hasTime))
    const id = setInterval(() => {
      setOverdue(isOverdue(followup.followUpISO, followup.hasTime))
    }, 1000)
    return () => clearInterval(id)
  }, [followup.followUpISO, followup.hasTime])

  const label = formatFollowupLabel(followup.followUpISO, followup.hasTime)

  const handleToggle = () => {
    const next = !expanded
    setExpanded(next)
    if (next && !remarks && onLoadRemarks) {
      onLoadRemarks(followup.dealerName)
    }
  }

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
            {followup.color && (
              <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">
                {followup.color}
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
        {followup.remarksCount > 0 && (
          <button
            type="button"
            onClick={handleToggle}
            className="mt-3 text-xs font-semibold text-brand-600"
          >
            {expanded ? 'Hide remarks' : 'See more'} ({followup.remarksCount})
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-4 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          {remarksLoading && <p className="text-xs text-slate-500">Loading remarks...</p>}
          {!remarksLoading && remarks && remarks.length === 0 && (
            <p className="text-xs text-slate-500">No remarks available.</p>
          )}
          {!remarksLoading &&
            remarks &&
            remarks.map((item, index) => {
              const timestampLabel = item.timestampISO
                ? formatInTimeZone(
                    parseISO(item.timestampISO),
                    TIMEZONE,
                    'd MMM, h:mm a',
                  )
                : ''
              return (
                <div key={`${item.timestampISO}-${index}`}>
                  <p className="text-xs font-semibold text-slate-500">
                    {item.outcome} - {timestampLabel}
                  </p>
                  <p className="text-sm text-slate-700">{item.remark}</p>
                  {item.location && (
                    <p className="mt-1 text-xs text-slate-400">{item.location}</p>
                  )}
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}