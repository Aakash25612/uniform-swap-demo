import { handleKitSwapRequest } from '../shared/openaiEdit.js'

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '16mb',
    },
  },
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const body = { ...(req.body || {}) }
    delete body.apiKey
    const result = await handleKitSwapRequest(body)
    res.status(200).json(result)
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Kit swap failed' })
  }
}
