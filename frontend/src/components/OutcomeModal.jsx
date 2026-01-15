import { useEffect, useMemo, useState } from 'react'
import Modal from './Modal'
import Spinner from './Spinner'
import { toLocalInputValue } from '../utils/date'

const OUTCOMES = [
  { value: 'NR', label: 'NR (Not Required)' },
  { value: 'AI', label: 'AI (Accounts Intel)' },
  { value: 'OR', label: 'OR (Order Received)' },
  { value: 'MD', label: 'MD (MD Denied)' },
  { value: 'SF', label: 'SF (Schedule Follow Up)' },
]

export default function OutcomeModal({ open, followup, onClose, onSubmit, submitting }) {
  const [outcome, setOutcome] = useState('NR')
  const [remark, setRemark] = useState('')
  const [location, setLocation] = useState('')
  const [orderText, setOrderText] = useState('')
  const [sfDatetime, setSfDatetime] = useState('')

  useEffect(() => {
    if (!followup) return
    setOutcome('NR')
    setRemark('')
    setLocation('')
    setOrderText('')
    setSfDatetime('')
  }, [followup?.rowIndex])

  const showOrderFields = outcome === 'OR'
  const showSfFields = outcome === 'SF'

  const isValid = useMemo(() => {
    if (!remark.trim()) return false
    if (showOrderFields) {
      return location.trim() && orderText.trim()
    }
    if (showSfFields) {
      return Boolean(sfDatetime)
    }
    return true
  }, [remark, location, orderText, showOrderFields, showSfFields, sfDatetime])

  const handleQuick = (minutes) => {
    const date = new Date()
    date.setMinutes(date.getMinutes() + minutes)
    setSfDatetime(toLocalInputValue(date))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!isValid || submitting) return

    const payload = {
      rowIndex: followup.rowIndex,
      outcome,
      remark: remark.trim(),
    }

    if (showOrderFields) {
      payload.location = location.trim()
      payload.orderText = orderText.trim()
    }

    if (showSfFields) {
      payload.sfDatetimeISO = new Date(sfDatetime).toISOString()
    }

    await onSubmit(payload)
  }

  return (
    <Modal
      open={open}
      onClose={submitting ? () => {} : onClose}
      title={followup ? `Log outcome for ${followup.dealerName}` : 'Log outcome'}
    >
      {followup && (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Outcome
            </label>
            <select
              value={outcome}
              onChange={(event) => setOutcome(event.target.value)}
              className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
            >
              {OUTCOMES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Remark
            </label>
            <textarea
              value={remark}
              onChange={(event) => setRemark(event.target.value)}
              className="mt-2 min-h-[110px] w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm"
              placeholder="Add the latest remark"
              required
            />
          </div>

          {showOrderFields && (
            <div className="space-y-4 rounded-2xl border border-brand-100 bg-brand-50/30 p-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Dealer Name
                </label>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={followup.dealerName}
                  readOnly
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Location
                </label>
                <input
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  placeholder="Enter location"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Order Details
                </label>
                <textarea
                  className="mt-2 min-h-[140px] w-full resize-y rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={orderText}
                  onChange={(event) => setOrderText(event.target.value)}
                  placeholder="Capture full order details"
                  required
                />
              </div>
            </div>
          )}

          {showSfFields && (
            <div className="space-y-4 rounded-2xl border border-brand-100 bg-brand-50/30 p-4">
              <div className="flex flex-wrap gap-2">
                {[15, 30, 45, 60].map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    className="rounded-full border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-600"
                    onClick={() => handleQuick(minutes)}
                  >
                    +{minutes === 60 ? '1 hr' : `${minutes} min`}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  Custom Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  value={sfDatetime}
                  onChange={(event) => setSfDatetime(event.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid || submitting}
              className="inline-flex items-center gap-2 rounded-full bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-500 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {submitting && <Spinner size={16} className="text-white" />}
              Submit Outcome
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}