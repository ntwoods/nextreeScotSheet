const API_BASE = import.meta.env.VITE_API_BASE

export async function apiPost(action, payload = {}, idToken) {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set")

  const response = await fetch(API_BASE, {
    method: "POST",
    // ✅ IMPORTANT: No headers => avoids CORS preflight (OPTIONS)
    body: JSON.stringify({ action, idToken, ...payload }),
  })

  const text = await response.text()
  const data = (() => {
    try { return JSON.parse(text) } catch { return null }
  })()

  if (!response.ok || !data || data.ok === false) {
    const message = data?.error || "Request failed"
    const error = new Error(message)
    error.code = data?.code || response.status
    throw error
  }

  return data.data
}
