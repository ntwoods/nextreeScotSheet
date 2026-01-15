const API_BASE = import.meta.env.VITE_API_BASE

export async function apiPost(action, payload = {}, idToken) {
  if (!API_BASE) {
    console.error("VITE_API_BASE environment variable is not set. Please check your .env file.")
    throw new Error("VITE_API_BASE is not set")
  }

  const res = await fetch(API_BASE, {
    method: "POST",
    // ƒo. preflight avoid
    body: JSON.stringify({ action, idToken, ...payload }),
  })

  const text = await res.text()
  let data = null

  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      throw new Error(
        `Non-JSON response from API. Status=${res.status}, URL=${res.url}\n` +
        `Snippet: ${text.slice(0, 180)}`
      )
    }
  }

  if (!res.ok || !data || data.ok === false) {
    const message =
      data?.error ||
      (text && text.trim().startsWith("<")
        ? "Apps Script returned HTML. Check that the Web App URL is correct and deployed for anyone."
        : "Request failed")
    const error = new Error(message)
    error.code = data?.code || res.status
    throw error
  }

  if (!data.ok) throw new Error(data.error || "Request failed")
  return data.data
}
