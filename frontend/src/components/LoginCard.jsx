import { GoogleLogin } from '@react-oauth/google'

export default function LoginCard({ onSuccess, onError }) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6 rounded-3xl bg-white p-10 text-center shadow-soft">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-brand-500">
          NEXTREE SCOT
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-slate-900">
          SCOT Portal
        </h1>
        <p className="mt-3 text-sm text-slate-500">
          Sign in with your Google account to track today&apos;s follow-ups.
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 px-6 py-4">
        <GoogleLogin onSuccess={onSuccess} onError={onError} useOneTap />
      </div>
    </div>
  )
}