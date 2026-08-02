import UTIF from 'utif2'

/**
 * Load PNG (native) or TIFF (utif2) into an object URL the canvas can draw.
 */
export async function fileToImageUrl(file) {
  const name = file.name || ''
  const isTiff =
    file.type === 'image/tiff' ||
    file.type === 'image/tif' ||
    /\.tiff?$/i.test(name)

  if (!isTiff) {
    return URL.createObjectURL(file)
  }

  const buffer = await file.arrayBuffer()
  const ifds = UTIF.decode(buffer)
  if (!ifds?.length) throw new Error('Could not decode TIFF')
  UTIF.decodeImage(buffer, ifds[0])
  const rgba = UTIF.toRGBA8(ifds[0])
  const width = ifds[0].width
  const height = ifds[0].height
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  const imageData = new ImageData(new Uint8ClampedArray(rgba), width, height)
  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL('image/png')
}
