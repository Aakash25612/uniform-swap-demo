/** Client-side kit swap — no server. Color remaps jersey/hat while protecting skin & face. */

export function hexToRgb(hex) {
  const h = hex.replace('#', '')
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  const n = parseInt(full, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

export function dist2(a, b) {
  const dr = a.r - b.r
  const dg = a.g - b.g
  const db = a.b - b.b
  return dr * dr + dg * dg + db * db
}

export function luminance({ r, g, b }) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export function isSkinTone({ r, g, b }) {
  // Broad skin detection to protect face / neck / arms
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return (
    r > 60 &&
    g > 30 &&
    b > 15 &&
    r >= g &&
    r >= b &&
    max - min > 15 &&
    r - g > 8 &&
    r - b > 12 &&
    b < 200
  )
}

function clamp(n) {
  return Math.max(0, Math.min(255, Math.round(n)))
}

/** Keep shading: map source color → target while preserving relative brightness. */
export function transferColor(pixel, from, to) {
  const srcLum = Math.max(luminance(from), 1)
  const pxLum = luminance(pixel)
  const ratio = pxLum / srcLum
  return {
    r: clamp(to.r * ratio),
    g: clamp(to.g * ratio),
    b: clamp(to.b * ratio),
  }
}

function nearestMatch(pixel, palette) {
  let best = null
  let bestD = Infinity
  for (const entry of palette) {
    const d = dist2(pixel, entry.from)
    if (d < bestD) {
      bestD = d
      best = entry
    }
  }
  return { entry: best, d: bestD }
}

/**
 * Build source→target palette from team kits.
 * Whites/light secondaries get a tighter threshold so backgrounds don't wash out.
 */
export function buildPalette(fromTeam, toTeam) {
  const fromPrimary = hexToRgb(fromTeam.primary)
  const fromSecondary = hexToRgb(fromTeam.secondary)
  const fromAccent = hexToRgb(fromTeam.accent)
  const fromHat = hexToRgb(fromTeam.hat)
  const toPrimary = hexToRgb(toTeam.primary)
  const toSecondary = hexToRgb(toTeam.secondary)
  const toAccent = hexToRgb(toTeam.accent)
  const toHat = hexToRgb(toTeam.hat)

  return [
    { from: fromPrimary, to: toPrimary, threshold: 95, zone: 'jersey' },
    {
      from: fromSecondary,
      to: toSecondary,
      threshold: luminance(fromSecondary) > 200 ? 40 : 90,
      zone: 'jersey',
    },
    { from: fromAccent, to: toAccent, threshold: 70, zone: 'trim' },
    { from: fromHat, to: toHat, threshold: 100, zone: 'hat' },
  ]
}

/**
 * Sample dominant non-skin colors in hat / jersey bands for uploaded photos
 * whose jersey may not match official hex values exactly.
 */
export function detectKitColors(imageData, width, height) {
  const { data } = imageData
  const hatBuckets = new Map()
  const jerseyBuckets = new Map()

  const quantize = (r, g, b) => {
    const qr = r >> 4
    const qg = g >> 4
    const qb = b >> 4
    return (qr << 8) | (qg << 4) | qb
  }
  const fromKey = (key) => ({
    r: ((key >> 8) & 15) * 17,
    g: ((key >> 4) & 15) * 17,
    b: (key & 15) * 17,
  })

  const step = Math.max(2, Math.floor(Math.min(width, height) / 120))

  for (let y = 0; y < height; y += step) {
    const yNorm = y / height
    for (let x = 0; x < width; x += step) {
      const i = (y * width + x) * 4
      const a = data[i + 3]
      if (a < 200) continue
      const pixel = { r: data[i], g: data[i + 1], b: data[i + 2] }
      if (isSkinTone(pixel)) continue
      // skip near-grayscale backgrounds / shadows
      const max = Math.max(pixel.r, pixel.g, pixel.b)
      const min = Math.min(pixel.r, pixel.g, pixel.b)
      if (max - min < 18 && max < 40) continue

      const key = quantize(pixel.r, pixel.g, pixel.b)
      const band = yNorm < 0.28 ? hatBuckets : yNorm > 0.42 ? jerseyBuckets : null
      if (!band) continue
      band.set(key, (band.get(key) || 0) + 1)
    }
  }

  const topColor = (map, fallback) => {
    let bestKey = null
    let bestCount = 0
    for (const [key, count] of map) {
      if (count > bestCount) {
        bestCount = count
        bestKey = key
      }
    }
    return bestKey != null ? fromKey(bestKey) : fallback
  }

  const secondColor = (map, first, fallback) => {
    let bestKey = null
    let bestCount = 0
    const firstKey = quantize(first.r, first.g, first.b)
    for (const [key, count] of map) {
      if (key === firstKey) continue
      if (count > bestCount) {
        bestCount = count
        bestKey = key
      }
    }
    return bestKey != null ? fromKey(bestKey) : fallback
  }

  const hat = topColor(hatBuckets, hexToRgb('#0C2340'))
  const primary = topColor(jerseyBuckets, hexToRgb('#0C2340'))
  const secondary = secondColor(jerseyBuckets, primary, hexToRgb('#FFFFFF'))
  return { hat, primary, secondary }
}

function zoneWeight(xNorm, yNorm, zone) {
  if (zone === 'hat') {
    // Cap region (chest-up headshots)
    const d = Math.hypot((xNorm - 0.5) / 0.34, (yNorm - 0.26) / 0.2)
    return d < 1 && yNorm < 0.42 ? 1 - d * 0.35 : 0
  }
  if (zone === 'jersey') {
    // Shoulders / chest — skip face band
    if (yNorm < 0.48) return 0
    const d = Math.hypot((xNorm - 0.5) / 0.48, (yNorm - 0.78) / 0.4)
    return d < 1 ? 1 - d * 0.25 : 0
  }
  // trim / accents along collar & placket
  if (yNorm < 0.5 || yNorm > 0.95) return 0
  const nearCenter = Math.abs(xNorm - 0.5) < 0.12
  const collar = yNorm > 0.5 && yNorm < 0.62 && Math.abs(xNorm - 0.5) < 0.22
  return nearCenter || collar ? 0.85 : 0
}

/**
 * Remap kit colors on an ImageData buffer (returns a copy).
 */
export function remapKitImageData(imageData, palette, { protectCenterFace = true } = {}) {
  const { width, height, data } = imageData
  const out = new ImageData(new Uint8ClampedArray(data), width, height)
  const od = out.data

  for (let y = 0; y < height; y++) {
    const yNorm = y / height
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const a = od[i + 3]
      if (a < 10) continue

      const pixel = { r: od[i], g: od[i + 1], b: od[i + 2] }
      if (isSkinTone(pixel)) continue

      // Skip near-black backdrop so stadium gradients don't pick up navy kits
      const lum = luminance(pixel)
      if (lum < 14) continue

      const xNorm = x / width

      if (protectCenterFace) {
        const face =
          Math.hypot((xNorm - 0.5) / 0.17, (yNorm - 0.34) / 0.15) < 1 &&
          yNorm > 0.16 &&
          yNorm < 0.5
        if (face) continue
      }

      const { entry, d } = nearestMatch(pixel, palette)
      if (!entry) continue
      const thresh = entry.threshold * entry.threshold
      if (d > thresh) continue

      const zw = zoneWeight(xNorm, yNorm, entry.zone)
      if (zw <= 0.05) continue

      const strength = (1 - d / thresh) * zw
      const mapped = transferColor(pixel, entry.from, entry.to)
      od[i] = clamp(pixel.r + (mapped.r - pixel.r) * strength)
      od[i + 1] = clamp(pixel.g + (mapped.g - pixel.g) * strength)
      od[i + 2] = clamp(pixel.b + (mapped.b - pixel.b) * strength)
    }
  }

  return out
}

export function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not load image'))
    img.src = url
  })
}

export async function canvasFromImageSource(source, maxSize = 900) {
  let img
  if (typeof source === 'string') {
    img = await loadImageFromUrl(source)
  } else if (source instanceof HTMLImageElement || source instanceof HTMLCanvasElement) {
    img = source
  } else {
    throw new Error('Unsupported image source')
  }

  const sw = img.width || img.naturalWidth
  const sh = img.height || img.naturalHeight
  const scale = Math.min(1, maxSize / Math.max(sw, sh))
  const w = Math.max(1, Math.round(sw * scale))
  const h = Math.max(1, Math.round(sh * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)
  return canvas
}

export function canvasToDataUrl(canvas) {
  return canvas.toDataURL('image/png')
}

/**
 * Full client-side swap. Returns { beforeUrl, afterUrl }.
 */
export async function runKitSwap({ sourceUrl, fromTeam, toTeam, autoDetect = false }) {
  const canvas = await canvasFromImageSource(sourceUrl)
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  const beforeData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const beforeUrl = canvas.toDataURL('image/png')

  let palette = buildPalette(fromTeam, toTeam)

  if (autoDetect) {
    const detected = detectKitColors(beforeData, canvas.width, canvas.height)
    const toPrimary = hexToRgb(toTeam.primary)
    const toSecondary = hexToRgb(toTeam.secondary)
    const toHat = hexToRgb(toTeam.hat)
    palette = [
      { from: detected.primary, to: toPrimary, threshold: 110, zone: 'jersey' },
      {
        from: detected.secondary,
        to: toSecondary,
        threshold: luminance(detected.secondary) > 200 ? 55 : 100,
        zone: 'jersey',
      },
      { from: detected.hat, to: toHat, threshold: 115, zone: 'hat' },
      ...palette,
    ]
  }

  const afterData = remapKitImageData(beforeData, palette)
  ctx.putImageData(afterData, 0, 0)
  const afterUrl = canvas.toDataURL('image/png')

  return { beforeUrl, afterUrl, width: canvas.width, height: canvas.height }
}
