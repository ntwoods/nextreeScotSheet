import { useState } from 'react'
import { formatInTimeZone } from 'date-fns-tz'
import { parseISO } from 'date-fns'
import { TIMEZONE } from '../utils/date'
import Spinner from './Spinner'

function formatTimestamp(iso) {
  if (!iso) return ''
  const date = parseISO(iso)
  return formatInTimeZone(date, TIMEZONE, 'd MMM, h:mm a')
}

function buildPreview(text) {
  if (!text) return ''
  const cleaned = text.replace(/\s+/g, ' ').trim()
  if (cleaned.length <= 120) return cleaned
  return `${cleaned.slice(0, 120)}...`
}

export default function OrdersPanel({ orders, loading, onRefresh, isMobile }) {
  const [expanded, setExpanded] = useState({})

  return (
    <section className="flex h-full flex-col rounded-3xl border border-slate-200 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">
            Orders
          </p>
          <h2 className="text-lg font-semibold text-slate-900">
            Orders Received (Last 7 Days)
          </h2>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full border border-brand-100 px-3 py-1 text-xs font-semibold text-brand-600 hover:border-brand-200 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading && <Spinner size={12} className="text-brand-600" />}
          Refresh
        </button>
      </div>

      <div className="mt-4 flex-1 space-y-4 overflow-auto pr-1">
        {loading && (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            Loading recent orders...
          </div>
        )}
        {!loading && orders.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
            No orders logged in the last 7 days.
          </div>
        )}
        {!loading &&
          orders.map((order, index) => {
            const key = `${order.timestampISO}-${index}`
            const isExpanded = Boolean(expanded[key])
            return (
              <article key={key} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">
                      {formatTimestamp(order.timestampISO)}
                    </p>
                    <h3 className="mt-2 text-sm font-semibold text-slate-900">
                      {order.dealerName}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">{order.location}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
                    }
                    className="text-xs font-semibold text-brand-600"
                  >
                    {isExpanded ? 'Collapse' : 'Expand'}
                  </button>
                </div>
                <p className="mt-3 text-sm text-slate-600">
                  {isExpanded ? order.orderText : buildPreview(order.orderText)}
                </p>
              </article>
            )
          })}
      </div>
      {isMobile && (
        <p className="mt-4 text-xs text-slate-400">
          Tip: Scroll to see older orders.
        </p>
      )}
    </section>
  )
}
