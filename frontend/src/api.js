const API_BASE = import.meta.env.VITE_API_BASE

export async function apiPost(action, payload = {}, idToken) {
  if (!API_BASE) throw new Error("VITE_API_BASE is not set")

  const res = await fetch(API_BASE, {
    method: "POST",
    // ✅ preflight avoid
    body: JSON.stringify({ action, idToken, ...payload }),
  })

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
  }

  if (!data.ok) throw new Error(data.error || "Request failed")
  return data.data
}
