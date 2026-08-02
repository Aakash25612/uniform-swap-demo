/** Server-only OpenAI kit swap. Never import this from client code. */

export function buildDualImagePrompt() {
  return [
    'You are given two chest-up baseball media-day headshots.',
    'Image 1 is the NEW PLAYER — keep this person\'s face, skin, neck, ears, expression, body composition, shoulders, pose, and camera framing exactly.',
    'Image 2 is the KIT REFERENCE — copy only the baseball cap and jersey style/colors/logos from this photo onto Image 1.',
    'Output a single photorealistic studio headshot of the Image 1 player wearing the Image 2 uniform and hat.',
    'Do not change the player\'s identity. Do not use the face from Image 2. Keep lighting and neutral studio background consistent with Image 1.',
    'Chest-up only. Sharp embroidery, natural fabric folds, clean edges.',
  ].join(' ')
}

function decodeBase64Image(dataUrlOrBase64) {
  const raw = String(dataUrlOrBase64).replace(/^data:[^;]+;base64,/, '')
  return Buffer.from(raw, 'base64')
}

export async function callOpenAIImageEdit({
  apiKey,
  playerBytes,
  referenceBytes,
  playerMime = 'image/png',
  referenceMime = 'image/png',
  prompt,
  model = 'gpt-image-2',
  quality = 'low',
}) {
  const form = new FormData()
  form.append('image[]', new Blob([playerBytes], { type: playerMime }), 'player.png')
  form.append('image[]', new Blob([referenceBytes], { type: referenceMime }), 'reference.png')
  form.append('model', model)
  form.append('prompt', prompt)
  form.append('size', '1024x1536')
  form.append('quality', quality)

  const res = await fetch('https://api.openai.com/v1/images/edits', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  })

  const raw = await res.text()
  let json
  try {
    json = JSON.parse(raw)
  } catch {
    throw new Error(raw.slice(0, 240) || `OpenAI error ${res.status}`)
  }

  if (!res.ok) {
    throw new Error(json?.error?.message || `OpenAI error ${res.status}`)
  }

  const b64 = json?.data?.[0]?.b64_json
  if (!b64) throw new Error('OpenAI returned no image data')
  return { b64, model }
}

export async function handleKitSwapRequest(body) {
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw Object.assign(
      new Error('Server is missing OPENAI_API_KEY'),
      { status: 500 },
    )
  }

  const {
    playerBase64,
    referenceBase64,
    playerMime = 'image/png',
    referenceMime = 'image/png',
  } = body || {}

  if (!playerBase64 || !referenceBase64) {
    throw Object.assign(
      new Error('Both player photo and kit reference photo are required'),
      { status: 400 },
    )
  }

  const prompt = buildDualImagePrompt()
  const models = ['gpt-image-2', 'gpt-image-1.5', 'gpt-image-1']

  let lastError
  for (const model of models) {
    try {
      const result = await callOpenAIImageEdit({
        apiKey: key,
        playerBytes: decodeBase64Image(playerBase64),
        referenceBytes: decodeBase64Image(referenceBase64),
        playerMime,
        referenceMime,
        prompt,
        model,
        quality: 'low',
      })
      return {
        imageBase64: `data:image/png;base64,${result.b64}`,
        model: result.model,
      }
    } catch (err) {
      lastError = err
      const msg = String(err.message || '')
      if (/model|verif|access|not found|does not exist|unsupported/i.test(msg)) continue
      throw err
    }
  }

  throw lastError || new Error('All image models failed')
}
