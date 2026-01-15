import { formatInTimeZone } from 'date-fns-tz'
import { parseISO, differenceInSeconds } from 'date-fns'

export const TIMEZONE = 'Asia/Kolkata'

export function parseIsoDate(iso) {
  if (!iso) return null
  return parseISO(iso)
}

export function formatFollowupLabel(iso, hasTime) {
  const date = parseIsoDate(iso)
  if (!date) return ''
  const dateLabel = formatInTimeZone(date, TIMEZONE, 'd MMM')
  if (!hasTime) return dateLabel
  const timeLabel = formatInTimeZone(date, TIMEZONE, 'h:mm a')
  return `${dateLabel} - ${timeLabel}`
}

export function getDateKey(date) {
  return formatInTimeZone(date, TIMEZONE, 'yyyy-MM-dd')
}

export function isOverdue(iso, hasTime) {
  const date = parseIsoDate(iso)
  if (!date) return false
  const now = new Date()
  if (hasTime) {
    return date.getTime() < now.getTime()
  }
  return getDateKey(date) < getDateKey(now)
}

export function getCountdownParts(iso) {
  const target = parseIsoDate(iso)
  if (!target) return null
  const now = new Date()
  const total = differenceInSeconds(target, now)
  if (total <= 0) {
    return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 }
  }
  const days = Math.floor(total / 86400)
  const hours = Math.floor((total % 86400) / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  return { total, days, hours, minutes, seconds }
}

export function toLocalInputValue(date) {
  if (!date) return ''
  const pad = (n) => String(n).padStart(2, '0')
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}