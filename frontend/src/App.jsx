import { useCallback, useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import { apiPost } from './api'
import LoginCard from './components/LoginCard'
import FollowupCard from './components/FollowupCard'
import OrdersPanel from './components/OrdersPanel'
import OutcomeModal from './components/OutcomeModal'
import SkeletonCard from './components/SkeletonCard'
import Spinner from './components/Spinner'

const AUTH_KEY = 'scotPortalAuth'

const normalizeDealerKey = (dealerName) =>
  String(dealerName || '').trim().toLowerCase()

function Home() {
  const [auth, setAuth] = useState(() => {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  })
  const [followups, setFollowups] = useState([])
  const [orders, setOrders] = useState([])
  const [remarksByDealer, setRemarksByDealer] = useState({})
  const [remarksLoading, setRemarksLoading] = useState({})
  const [loadingFollowups, setLoadingFollowups] = useState(false)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [activeFollowup, setActiveFollowup] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [showOrdersMobile, setShowOrdersMobile] = useState(false)
  const isRefreshing = loadingFollowups || loadingOrders

  const handleLoginSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      toast.error('Missing Google credential')
      return
    }
    const nextAuth = { idToken: credentialResponse.credential, email: null }
    setAuth(nextAuth)
    localStorage.setItem(AUTH_KEY, JSON.stringify(nextAuth))
  }

  const handleLogout = () => {
    setAuth(null)
    setFollowups([])
    setOrders([])
    setRemarksByDealer({})
    localStorage.removeItem(AUTH_KEY)
  }

  const fetchFollowups = useCallback(async () => {
    if (!auth?.idToken) return
    setLoadingFollowups(true)
    try {
      const data = await apiPost('listFollowups', {}, auth.idToken)
      setFollowups(data.followups || [])
      if (data.userEmail) {
        setAuth((prev) => {
          const updated = { ...prev, email: data.userEmail }
          localStorage.setItem(AUTH_KEY, JSON.stringify(updated))
          return updated
        })
      }
    } catch (error) {
      toast.error(error.message || 'Unable to load follow-ups')
    } finally {
      setLoadingFollowups(false)
    }
  }, [auth?.idToken])

  const fetchOrders = useCallback(async () => {
    if (!auth?.idToken) return
    setLoadingOrders(true)
    try {
      const data = await apiPost('getOrdersLast7Days', {}, auth.idToken)
      setOrders(data.orders || [])
    } catch (error) {
      toast.error(error.message || 'Unable to load orders')
    } finally {
      setLoadingOrders(false)
    }
  }, [auth?.idToken])

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchFollowups(), fetchOrders()])
  }, [fetchFollowups, fetchOrders])

  useEffect(() => {
    if (auth?.idToken) {
      refreshAll()
    }
  }, [auth?.idToken, refreshAll])

  const handleLoadRemarks = async (dealerName) => {
    const key = normalizeDealerKey(dealerName)
    setRemarksLoading((prev) => ({ ...prev, [key]: true }))
    try {
      const data = await apiPost(
        'getRemarks',
        { dealerName },
        auth.idToken,
      )
      setRemarksByDealer((prev) => ({ ...prev, [key]: data.remarks || [] }))
    } catch (error) {
      toast.error(error.message || 'Unable to load remarks')
    } finally {
      setRemarksLoading((prev) => ({ ...prev, [key]: false }))
    }
  }

  const handleOutcomeSubmit = async (payload) => {
    if (!auth?.idToken) return
    setSubmitting(true)
    try {
      const data = await apiPost('submitOutcome', payload, auth.idToken)
      const updatedFollowup = data.updatedFollowup
      const dealerKey = normalizeDealerKey(activeFollowup.dealerName)
      const logEntry = data.logEntry

      setRemarksByDealer((prev) => {
        const existing = prev[dealerKey] || []
        return {
          ...prev,
          [dealerKey]: logEntry ? [logEntry, ...existing] : existing,
        }
      })

      setFollowups((prev) => {
        const next = []
        prev.forEach((item) => {
          if (item.rowIndex !== payload.rowIndex) {
            next.push(item)
            return
          }
          if (!updatedFollowup || !data.cardShouldStayToday) {
            return
          }
          next.push({
            ...item,
            followUpISO: updatedFollowup.followUpISO,
            hasTime: updatedFollowup.hasTime,
            overdue: updatedFollowup.overdue,
            latestRemark: payload.remark,
            remarksCount: (item.remarksCount || 0) + 1,
          })
        })
        return next
      })

      if (payload.outcome === 'OR') {
        await fetchOrders()
      }

      toast.success('Outcome logged successfully')
      setActiveFollowup(null)
    } catch (error) {
      toast.error(error.message || 'Unable to submit outcome')
    } finally {
      setSubmitting(false)
    }
  }

  if (!auth?.idToken) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 py-12">
        <LoginCard
          onSuccess={handleLoginSuccess}
          onError={() => toast.error('Google sign-in failed')}
        />
        <Toaster position="top-right" />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">NEXTREE SCOT</h1>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">
              Sales Coordinator Order Tracking
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">
              {auth.email || 'Signed in'}
            </span>
            <button
              type="button"
              onClick={refreshAll}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 rounded-full border border-brand-200 px-4 py-2 text-xs font-semibold text-brand-600 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isRefreshing && <Spinner size={12} className="text-brand-600" />}
              Refresh
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-400">
                  Follow Ups
                </p>
                <h2 className="text-lg font-semibold text-slate-900">
                  Today & Overdue
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowOrdersMobile((prev) => !prev)}
                className="rounded-full border border-brand-200 px-3 py-1 text-xs font-semibold text-brand-600 lg:hidden"
              >
                {showOrdersMobile ? 'Hide Orders' : 'View Orders'}
              </button>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {loadingFollowups && followups.length === 0 &&
                Array.from({ length: 4 }).map((_, index) => (
                  <SkeletonCard key={index} />
                ))}
              {!loadingFollowups && followups.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center text-sm text-slate-500">
                  No follow-ups due today. Check back later.
                </div>
              )}
              {!loadingFollowups &&
                followups.map((followup) => {
                  const dealerKey = normalizeDealerKey(followup.dealerName)
                  return (
                    <FollowupCard
                      key={followup.rowIndex}
                      followup={followup}
                      remarks={remarksByDealer[dealerKey]}
                      remarksLoading={remarksLoading[dealerKey]}
                      onLoadRemarks={handleLoadRemarks}
                      onOpen={setActiveFollowup}
                    />
                  )
                })}
            </div>
          </section>

          <div className="hidden lg:block">
            <OrdersPanel
              orders={orders}
              loading={loadingOrders}
              onRefresh={fetchOrders}
            />
          </div>
        </div>

        {showOrdersMobile && (
          <div className="mt-6 lg:hidden">
            <OrdersPanel
              orders={orders}
              loading={loadingOrders}
              onRefresh={fetchOrders}
              isMobile
            />
          </div>
        )}
      </main>

      <OutcomeModal
        open={Boolean(activeFollowup)}
        followup={activeFollowup}
        onClose={() => setActiveFollowup(null)}
        onSubmit={handleOutcomeSubmit}
        submitting={submitting}
      />

      <Toaster position="top-right" />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  )
}
