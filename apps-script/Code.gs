const SPREADSHEET_ID = '1ECi7Tx3QWPjq8nWL1O_90UfUwFW7VvnZssx_KeOh09Y'
const SCOT_SHEET_NAME = 'SCOT'
const LOGS_SHEET_NAME = 'Logs'
const TIMEZONE = 'Asia/Kolkata'
const CLIENT_ID = '360849757137-agopfs0m8rgmcj541ucpg22btep5olt3.apps.googleusercontent.com'
const ALLOW_ANY_DOMAIN = false

function doGet() {
  return jsonResponse({ ok: true, data: { status: 'ok' } })
}

function doPost(e) {
  try {
    const payload = parsePayload(e)
    const action = payload.action

    if (!action) {
      return jsonResponse({ ok: false, error: 'Missing action', code: 400 })
    }

    if (action === 'health') {
      return jsonResponse({ ok: true, data: { status: 'ok' } })
    }

    const userEmail = verifyIdToken(payload.idToken)

    switch (action) {
      case 'listFollowups':
        return jsonResponse({
          ok: true,
          data: listFollowups(userEmail),
        })
      case 'getRemarks':
        return jsonResponse({
          ok: true,
          data: getRemarks(payload, userEmail),
        })
      case 'submitOutcome':
        return jsonResponse({
          ok: true,
          data: submitOutcome(payload, userEmail),
        })
      case 'getOrdersLast7Days':
        return jsonResponse({
          ok: true,
          data: getOrdersLast7Days(userEmail),
        })
      default:
        return jsonResponse({ ok: false, error: 'Unknown action', code: 400 })
    }
  } catch (error) {
    return jsonResponse({
      ok: false,
      error: error.message || 'Server error',
      code: error.code || 500,
    })
  }
}

function parsePayload(e) {
  if (!e || !e.postData || !e.postData.contents) return {}
  return JSON.parse(e.postData.contents)
}

function jsonResponse(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(
    ContentService.MimeType.JSON,
  )
}

function verifyIdToken(idToken) {
  if (!idToken) {
    const error = new Error('Missing idToken')
    error.code = 401
    throw error
  }

  const url =
    'https://oauth2.googleapis.com/tokeninfo?id_token=' +
    encodeURIComponent(idToken)
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true })

  if (response.getResponseCode() !== 200) {
    const error = new Error('Invalid idToken')
    error.code = 401
    throw error
  }

  const info = JSON.parse(response.getContentText())

  if (info.aud !== CLIENT_ID) {
    const error = new Error('Invalid token audience')
    error.code = 401
    throw error
  }

  if (String(info.email_verified) !== 'true') {
    const error = new Error('Email not verified')
    error.code = 403
    throw error
  }

  const email = String(info.email || '').trim().toLowerCase()
  if (!email) {
    const error = new Error('Email not available')
    error.code = 403
    throw error
  }

  if (!ALLOW_ANY_DOMAIN && !email.endsWith('@ntwoods.com')) {
    const error = new Error('Unauthorized domain')
    error.code = 403
    throw error
  }

  return email
}

function listFollowups(userEmail) {
  const sheet = getScotSheet()
  const logsSheet = ensureLogsSheet()
  const values = getScotValues(sheet)
  const remarksByDealer = buildRemarksMap(logsSheet, userEmail)
  const todayKey = getDateKey(new Date())
  const followups = []

  values.forEach((row) => {
    const rowIndex = row.rowIndex
    const email = normalizeEmail(row.email)
    if (!email || email !== normalizeEmail(userEmail)) return

    const followUpDate = coerceDate(row.followUp)
    if (!followUpDate) return

    const followUpKey = getDateKey(followUpDate)
    if (followUpKey > todayKey) return

    const dealerName = String(row.dealerName || '').trim()
    const color = String(row.color || '').trim()
    const dealerKey = normalizeDealerKey(dealerName)
    const remarks = remarksByDealer[dealerKey] || []

    followups.push({
      rowIndex,
      dealerName,
      color,
      followUpISO: formatDateIso(followUpDate),
      hasTime: dateHasTime(followUpDate),
      overdue: isOverdue(followUpDate),
      latestRemark: remarks[0] ? remarks[0].remark : null,
      remarksCount: remarks.length,
    })
  })

  return { followups, userEmail }
}

function getRemarks(payload, userEmail) {
  const dealerName = String(payload.dealerName || '').trim()
  if (!dealerName) {
    const error = new Error('Missing dealerName')
    error.code = 400
    throw error
  }

  const logsSheet = ensureLogsSheet()
  const remarksByDealer = buildRemarksMap(logsSheet, userEmail)
  const key = normalizeDealerKey(dealerName)
  return {
    dealerName,
    remarks: remarksByDealer[key] || [],
  }
}

function submitOutcome(payload, userEmail) {
  const lock = LockService.getScriptLock()
  lock.waitLock(30000)

  try {
    const rowIndex = Number(payload.rowIndex)
    if (!rowIndex || rowIndex < 2) {
      const error = new Error('Invalid rowIndex')
      error.code = 400
      throw error
    }

    const outcome = String(payload.outcome || '').trim().toUpperCase()
    const remark = String(payload.remark || '').trim()

    if (!outcome) {
      const error = new Error('Missing outcome')
      error.code = 400
      throw error
    }

    if (!remark) {
      const error = new Error('Remark is required')
      error.code = 400
      throw error
    }

    const sheet = getScotSheet()
    const logsSheet = ensureLogsSheet()
    const rowRange = sheet.getRange(rowIndex, 1, 1, 4)
    const rowValues = rowRange.getValues()[0]

    const rowEmail = normalizeEmail(rowValues[0])
    if (rowEmail !== normalizeEmail(userEmail)) {
      const error = new Error('Unauthorized row access')
      error.code = 403
      throw error
    }

    const dealerName = String(rowValues[1] || '').trim()
    const color = String(rowValues[2] || '').trim()
    const oldFollowUp = coerceDate(rowValues[3])
    const oldFollowUpISO = oldFollowUp ? formatDateIso(oldFollowUp) : ''

    let newFollowUp = null
    let location = ''
    let orderText = ''

    if (outcome === 'NR' || outcome === 'AI' || outcome === 'OR') {
      if (outcome === 'OR') {
        location = String(payload.location || '').trim()
        orderText = String(payload.orderText || '').trim()
        if (!location || !orderText) {
          const error = new Error('Location and orderText are required')
          error.code = 400
          throw error
        }
      }

      newFollowUp = buildNextFollowup(oldFollowUp)
      sheet.getRange(rowIndex, 4).setValue(newFollowUp)
    } else if (outcome === 'MD') {
      sheet.getRange(rowIndex, 4).setValue('')
    } else if (outcome === 'SF') {
      const sfDatetimeISO = String(payload.sfDatetimeISO || '').trim()
      if (!sfDatetimeISO) {
        const error = new Error('sfDatetimeISO is required')
        error.code = 400
        throw error
      }
      newFollowUp = coerceDate(sfDatetimeISO)
      if (!newFollowUp) {
        const error = new Error('Invalid sfDatetimeISO')
        error.code = 400
        throw error
      }
      sheet.getRange(rowIndex, 4).setValue(newFollowUp)
    } else {
      const error = new Error('Invalid outcome')
      error.code = 400
      throw error
    }

    const newFollowUpISO = newFollowUp ? formatDateIso(newFollowUp) : ''
    const now = new Date()

    logsSheet.appendRow([
      now,
      userEmail,
      dealerName,
      outcome,
      remark,
      oldFollowUpISO,
      newFollowUpISO,
      location,
      orderText,
      rowIndex,
      color,
    ])

    const cardShouldStayToday = newFollowUp
      ? getDateKey(newFollowUp) === getDateKey(now)
      : false

    return {
      updatedFollowup: newFollowUp ? buildFollowupMeta(newFollowUp, now) : null,
      cardShouldStayToday,
      logEntry: {
        timestampISO: formatDateIso(now),
        outcome,
        remark,
        location,
        orderText,
      },
    }
  } finally {
    lock.releaseLock()
  }
}

function getOrdersLast7Days(userEmail) {
  const logsSheet = ensureLogsSheet()
  const values = logsSheet.getDataRange().getValues()
  const now = new Date()
  const threshold = now.getTime() - 7 * 24 * 60 * 60 * 1000
  const orders = []

  for (let i = values.length - 1; i >= 1; i -= 1) {
    const row = values[i]
    const email = normalizeEmail(row[1])
    const outcome = String(row[3] || '').trim().toUpperCase()

    if (email !== normalizeEmail(userEmail) || outcome !== 'OR') {
      continue
    }

    const timestamp = coerceDate(row[0])
    if (!timestamp || timestamp.getTime() < threshold) {
      continue
    }

    orders.push({
      timestampISO: formatDateIso(timestamp),
      dealerName: String(row[2] || '').trim(),
      location: String(row[7] || '').trim(),
      orderText: String(row[8] || '').trim(),
    })
  }

  return { orders }
}

function getScotSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID)
  const sheet = spreadsheet.getSheetByName(SCOT_SHEET_NAME)
  if (!sheet) {
    const error = new Error('SCOT sheet not found')
    error.code = 500
    throw error
  }
  return sheet
}

function ensureLogsSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID)
  let sheet = spreadsheet.getSheetByName(LOGS_SHEET_NAME)
  if (!sheet) {
    sheet = spreadsheet.insertSheet(LOGS_SHEET_NAME)
  }

  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp',
      'User Email',
      'Dealer Name',
      'Outcome',
      'Remark',
      'Old FollowUp',
      'New FollowUp',
      'Location',
      'OrderText',
      'RowIndex',
      'Dealer Color',
    ])
  }

  return sheet
}

function getScotValues(sheet) {
  const lastRow = sheet.getLastRow()
  if (lastRow < 2) return []
  const values = sheet.getRange(2, 1, lastRow - 1, 4).getValues()

  return values.map((row, index) => ({
    rowIndex: index + 2,
    email: row[0],
    dealerName: row[1],
    color: row[2],
    followUp: row[3],
  }))
}

function buildRemarksMap(logsSheet, userEmail) {
  const values = logsSheet.getDataRange().getValues()
  const map = {}

  for (let i = values.length - 1; i >= 1; i -= 1) {
    const row = values[i]
    const email = normalizeEmail(row[1])
    if (email !== normalizeEmail(userEmail)) continue

    const dealerName = String(row[2] || '').trim()
    const key = normalizeDealerKey(dealerName)
    if (!map[key]) map[key] = []

    map[key].push({
      timestampISO: formatDateIso(coerceDate(row[0])),
      outcome: String(row[3] || '').trim(),
      remark: String(row[4] || '').trim(),
      oldFollowUp: String(row[5] || '').trim(),
      newFollowUp: String(row[6] || '').trim(),
      location: String(row[7] || '').trim(),
      orderText: String(row[8] || '').trim(),
    })
  }

  return map
}

function buildNextFollowup(oldFollowUp) {
  const now = new Date()
  const nowParts = getTzParts(now)
  let hours = 0
  let minutes = 0
  let seconds = 0

  if (oldFollowUp && dateHasTime(oldFollowUp)) {
    const oldParts = getTzParts(oldFollowUp)
    hours = oldParts.hours
    minutes = oldParts.minutes
    seconds = oldParts.seconds
  }

  return makeDateInTimeZone(
    nowParts.year,
    nowParts.month,
    nowParts.day + 15,
    hours,
    minutes,
    seconds,
  )
}

function buildFollowupMeta(date, now) {
  return {
    followUpISO: formatDateIso(date),
    hasTime: dateHasTime(date),
    overdue: isOverdue(date, now),
  }
}

function isOverdue(date, now) {
  const reference = now || new Date()
  if (dateHasTime(date)) {
    return date.getTime() < reference.getTime()
  }
  return getDateKey(date) < getDateKey(reference)
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeDealerKey(value) {
  return String(value || '').trim().toLowerCase()
}

function dateHasTime(date) {
  if (!date || !(date instanceof Date)) return false
  const parts = getTzParts(date)
  return parts.hours !== 0 || parts.minutes !== 0 || parts.seconds !== 0
}

function formatDateIso(date) {
  if (!date || !(date instanceof Date)) return ''
  return Utilities.formatDate(date, TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX")
}

function getDateKey(date) {
  return Utilities.formatDate(date, TIMEZONE, 'yyyy-MM-dd')
}

function getTzParts(date) {
  return {
    year: Number(Utilities.formatDate(date, TIMEZONE, 'yyyy')),
    month: Number(Utilities.formatDate(date, TIMEZONE, 'MM')) - 1,
    day: Number(Utilities.formatDate(date, TIMEZONE, 'dd')),
    hours: Number(Utilities.formatDate(date, TIMEZONE, 'HH')),
    minutes: Number(Utilities.formatDate(date, TIMEZONE, 'mm')),
    seconds: Number(Utilities.formatDate(date, TIMEZONE, 'ss')),
  }
}

function makeDateInTimeZone(year, month, day, hours, minutes, seconds) {
  const iso = Utilities.formatString(
    '%04d-%02d-%02dT%02d:%02d:%02d+05:30',
    year,
    month + 1,
    day,
    hours,
    minutes,
    seconds,
  )
  return new Date(iso)
}

function coerceDate(value) {
  if (value === null || value === undefined || value === '') return null
  if (value instanceof Date) return value

  if (typeof value === 'number' && !Number.isNaN(value)) {
    const millis = Math.round((value - 25569) * 86400 * 1000)
    if (!Number.isNaN(millis)) return new Date(millis)
  }

  const raw = String(value).trim()
  if (!raw) return null

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) return parsed

  const match = raw.match(
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  )
  if (!match) return null

  const day = Number(match[1])
  const month = Number(match[2]) - 1
  const year = Number(match[3])
  const hours = match[4] ? Number(match[4]) : 0
  const minutes = match[5] ? Number(match[5]) : 0
  const seconds = match[6] ? Number(match[6]) : 0

  if (
    Number.isNaN(day) ||
    Number.isNaN(month) ||
    Number.isNaN(year) ||
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    Number.isNaN(seconds)
  ) {
    return null
  }

  return makeDateInTimeZone(year, month, day, hours, minutes, seconds)
}
