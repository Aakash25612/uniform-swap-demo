import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { handleKitSwapRequest } from './shared/openaiEdit.js'

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (c) => chunks.push(c))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? JSON.parse(raw) : {})
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

function kitSwapApiPlugin() {
  return {
    name: 'kit-swap-api',
    configureServer(server) {
      server.middlewares.use('/api/kit-swap', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.end()
          return
        }
        if (req.method !== 'POST') {
          next()
          return
        }

        try {
          const body = await readJsonBody(req)
          const result = await handleKitSwapRequest(body)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (err) {
          res.statusCode = err.status || 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message || 'Kit swap failed' }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), kitSwapApiPlugin()],
})
