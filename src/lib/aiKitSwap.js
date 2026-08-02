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

export async function prepareImagePayload(sourceUrl, maxEdge = 1536) {
  const img = await new Promise((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('Could not load image'))
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
  return {
    imageBase64: await blobToBase64(blob),
    previewUrl: canvas.toDataURL('image/png'),
    mimeType: 'image/png',
  }
}

/**
 * Client never sends an API key — the server holds OPENAI_API_KEY.
 */
export async function requestAiKitSwap({ playerUrl, referenceUrl }) {
  const [player, reference] = await Promise.all([
    prepareImagePayload(playerUrl),
    prepareImagePayload(referenceUrl),
  ])

  const res = await fetch('/api/kit-swap', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      playerBase64: player.imageBase64,
      referenceBase64: reference.imageBase64,
      playerMime: player.mimeType,
      referenceMime: reference.mimeType,
    }),
  })

  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `Swap failed (${res.status})`)

  return {
    beforeUrl: player.previewUrl,
    afterUrl: json.imageBase64,
    model: json.model,
  }
}
