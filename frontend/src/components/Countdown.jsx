import { useEffect, useState } from 'react'
import { getCountdownParts } from '../utils/date'

export default function Countdown({ iso }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setTick((value) => value + 1)
    }, 1000)
    return () => clearInterval(id)
  }, [])

  const parts = getCountdownParts(iso, tick)
  if (!parts) return null
  if (parts.total <= 0) {
    return <span className="text-xs font-semibold text-red-600">OVERDUE</span>
  }

  const segments = []
  if (parts.days > 0) segments.push(`${parts.days}d`)
  if (parts.hours > 0 || parts.days > 0) segments.push(`${parts.hours}h`)
  segments.push(`${String(parts.minutes).padStart(2, '0')}m`)
  segments.push(`${String(parts.seconds).padStart(2, '0')}s`)

  return (
    <span className="text-xs font-medium text-brand-700">
      in {segments.join(' ')}
    </span>
  )
}
