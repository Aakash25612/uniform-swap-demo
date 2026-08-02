/** Shared OpenAI kit-swap helpers (browser + local Vite middleware + Vercel). */

export function buildKitSwapPrompt(fromTeam, toTeam) {
  const jersey = toTeam.pinstripe
    ? `white home jersey with thin ${toTeam.primary} pinstripes, button-up collar, Nike swoosh on the wearer's right chest`
    : `${toTeam.primary} jersey with ${toTeam.secondary} trim, chest-up media-day style, Nike swoosh on the wearer's right chest`

  return [
    'Edit this professional baseball media-day headshot (chest-up framing only).',
    'CRITICAL: Keep the player identity identical — same face, skin tone, neck, ears, expression, body composition, shoulder shape, pose, camera angle, lighting, and neutral studio gray background.',
    `He is currently in a ${fromTeam.name} (${fromTeam.short}) kit. Replace ONLY the baseball cap and jersey so he appears freshly traded into a ${toTeam.name} (${toTeam.short}) uniform.`,
    `Cap: solid ${toTeam.hat} cap with a clean white/contrasting "${toTeam.logoLetter}" logo centered on the front (official-looking embroidery).`,
    `Jersey: ${jersey}.`,
    'Do not invent a new person. Do not change the head shape or paste a different face. Do not crop differently. Photorealistic studio quality, sharp edges, natural fabric folds and shadows matching the original light.',
  ].join(' ')
}

export async function callOpenAIImageEdit({
  apiKey,
  imageBytes,
  fileName = 'player.png',
  mimeType = 'image/png',
  prompt,
  model = 'gpt-image-1.5',
}) {
  const form = new FormData()
  const blob = new Blob([imageBytes], { type: mimeType })
  form.append('image', blob, fileName)
  form.append('model', model)
  form.append('prompt', prompt)
  form.append('size', '1024x1536')
  form.append('input_fidelity', 'high')
  form.append('quality', 'high')

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
    const msg = json?.error?.message || `OpenAI error ${res.status}`
    throw new Error(msg)
  }

  const b64 = json?.data?.[0]?.b64_json
  if (!b64) throw new Error('OpenAI returned no image data')
  return { b64, model }
}

export async function handleKitSwapRequest(body) {
  const {
    imageBase64,
    mimeType = 'image/png',
    fromTeam,
    toTeam,
    apiKey,
    model,
  } = body || {}

  const key = apiKey || process.env.OPENAI_API_KEY
  if (!key) {
    throw Object.assign(new Error('Missing OpenAI API key'), { status: 401 })
  }
  if (!imageBase64 || !fromTeam || !toTeam) {
    throw Object.assign(new Error('imageBase64, fromTeam, and toTeam are required'), {
      status: 400,
    })
  }

  const base64 = String(imageBase64).replace(/^data:[^;]+;base64,/, '')
  const binary = Buffer.from(base64, 'base64')
  const prompt = buildKitSwapPrompt(fromTeam, toTeam)

  const models = model
    ? [model]
    : ['gpt-image-1.5', 'gpt-image-1', 'gpt-image-1-mini']

  let lastError
  for (const m of models) {
    try {
      const result = await callOpenAIImageEdit({
        apiKey: key,
        imageBytes: binary,
        mimeType,
        prompt,
        model: m,
      })
      return {
        imageBase64: `data:image/png;base64,${result.b64}`,
        model: result.model,
        prompt,
      }
    } catch (err) {
      lastError = err
      // try next model on model-not-found / verification style failures
      const msg = String(err.message || '')
      if (/model|verif|access|not found|does not exist/i.test(msg)) continue
      throw err
    }
  }
  throw lastError || new Error('All image models failed')
}
