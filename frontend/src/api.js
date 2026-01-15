const API_BASE = import.meta.env.VITE_API_BASE

export async function apiPost(action, payload = {}, idToken) {
<<<<<<< HEAD
  if (!API_BASE) {
    console.error('VITE_API_BASE environment variable is not set. Please check your .env file.')
    throw new Error('VITE_API_BASE is not set')
  }
=======
  if (!API_BASE) throw new Error("VITE_API_BASE is not set")
>>>>>>> 3939a0c4bc043a08cd321224814c63f17e1d8d50

  const res = await fetch(API_BASE, {
    method: "POST",
    // ✅ preflight avoid
    body: JSON.stringify({ action, idToken, ...payload }),
  })

<<<<<<< HEAD
  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = null
    }
  }

  if (!response.ok || !data || data.ok === false) {
    const message =
      data?.error ||
      (text && text.trim().startsWith('<')
        ? 'Apps Script returned HTML. Check that the Web App URL is correct and deployed for anyone.'
        : 'Request failed')
    const error = new Error(message)
    error.code = data?.code || response.status
    throw error
=======
  const text = await res.text()

  let data
  try {
    data = JSON.parse(text)
  } catch {
    // 👇 yahi tumhe real reason dikha dega (HTML/redirect)
    throw new Error(
      `Non-JSON response from API. Status=${res.status}, URL=${res.url}\n` +
      `Snippet: ${text.slice(0, 180)}`
    )
>>>>>>> 3939a0c4bc043a08cd321224814c63f17e1d8d50
  }

  if (!data.ok) throw new Error(data.error || "Request failed")
  return data.data
}
