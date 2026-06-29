const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')

function createContext() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  })

  const context = vm.createContext({
    Utilities: {
      formatDate(date, timezone, pattern) {
        assert.equal(timezone, 'Asia/Kolkata')
        const parts = Object.fromEntries(
          formatter
            .formatToParts(date)
            .filter((part) => part.type !== 'literal')
            .map((part) => [part.type, part.value]),
        )
        const values = {
          yyyy: parts.year,
          MM: parts.month,
          dd: parts.day,
          HH: parts.hour,
          mm: parts.minute,
          ss: parts.second,
        }
        return values[pattern]
      },
      formatString(pattern, ...values) {
        let index = 0
        return pattern.replace(/%0(\d)d/g, (_match, width) =>
          String(values[index++]).padStart(Number(width), '0'),
        )
      },
    },
  })

  const source = fs.readFileSync(path.join(__dirname, 'Code.gs'), 'utf8')
  vm.runInContext(source, context)
  return context
}

function run(context, expression) {
  return vm.runInContext(expression, context)
}

test('29 June 2026 plus a four-day interval becomes 3 July 2026', () => {
  const context = createContext()
  const iso = run(
    context,
    "buildNextFollowup(new Date('2026-06-29T00:00:00+05:30'), 4, new Date('2026-06-29T10:00:00+05:30')).toISOString()",
  )
  assert.equal(iso, '2026-07-02T18:30:00.000Z')
})

test('calendar arithmetic crosses year and month boundaries', () => {
  const context = createContext()
  const iso = run(
    context,
    "buildNextFollowup(null, 4, new Date('2026-12-29T10:00:00+05:30')).toISOString()",
  )
  assert.equal(iso, '2027-01-01T18:30:00.000Z')
})

test('the existing follow-up time is retained', () => {
  const context = createContext()
  const iso = run(
    context,
    "buildNextFollowup(new Date('2026-06-29T14:45:30+05:30'), 4, new Date('2026-06-29T10:00:00+05:30')).toISOString()",
  )
  assert.equal(iso, '2026-07-03T09:15:30.000Z')
})

test('date coercion is strict and treats slash dates as day-first', () => {
  const context = createContext()
  assert.equal(
    run(context, "coerceDate('06/07/2026').toISOString()"),
    '2026-07-05T18:30:00.000Z',
  )
  assert.equal(run(context, "coerceDate('31/02/2026')"), null)
  assert.equal(run(context, 'coerceDate(new Date(NaN))'), null)
  assert.equal(run(context, 'coerceDate(0)'), null)
})
