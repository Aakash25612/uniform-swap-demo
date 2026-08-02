const KEY_STORAGE = 'tradekit_openai_key'

export function getStoredApiKey() {
  try {
    return sessionStorage.getItem(KEY_STORAGE) || ''
  } catch {
    return ''
  }
}

export function setStoredApiKey(key) {
  try {
    if (key) sessionStorage.setItem(KEY_STORAGE, key)
    else sessionStorage.removeItem(KEY_STORAGE)
  } catch {
    // ignore
  }
}

async function blobToBase64(blob) {
  const buffer = await blob.arrayBuffer()
  let binary = ''
  const bytes = new Uint8ClampedArray(buffer)
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

/** Downscale large uploads before sending to the API. */
export async function prepareImagePayload(sourceUrl, maxEdge = 1536) {
  const img = await new Promise((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('Could not load source image'))
    el.crossOrigin = 'anonymous'
    el.src = sourceUrl
  })

  const scale = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
  if (!blob) throw new Error('Could not encode PNG')
  const imageBase64 = await blobToBase64(blob)
  const beforeUrl = canvas.toDataURL('image/png')
  return { imageBase64, beforeUrl, mimeType: 'image/png', width: w, height: h }
}

export async function requestAiKitSwap({ sourceUrl, fromTeam, toTeam, apiKey }) {
  const prepared = await prepareImagePayload(sourceUrl)
  const res = await fetch('/api/kit-swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      imageBase64: prepared.imageBase64,
      mimeType: prepared.mimeType,
      fromTeam,
      toTeam,
      apiKey,
    }),
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json.error || `Swap failed (${res.status})`)
  }

  return {
    beforeUrl: prepared.beforeUrl,
    afterUrl: json.imageBase64,
    model: json.model,
  }
}
