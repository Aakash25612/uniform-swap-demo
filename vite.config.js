import { config as loadDotenv } from 'dotenv'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { handleKitSwapRequest } from './shared/openaiEdit.js'

loadDotenv()

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
      // Ensure .env is available to the middleware
      const env = loadEnv(server.config.mode, server.config.root, '')
      if (env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = env.OPENAI_API_KEY

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
          // Never accept client-supplied keys
          delete body.apiKey
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
  // Do not expose OPENAI_API_KEY to client bundles
  envPrefix: ['VITE_'],
})
