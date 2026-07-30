import cors from 'cors'
import express from 'express'
import { env } from './config/env.js'
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js'
import { createApiRouter } from './routes/index.js'
import type { Server } from 'socket.io'

export function createApp(io: Server) {
  const app = express()

  app.use(cors({ origin: env.clientUrl }))
  app.use(express.json())

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })
  app.use('/api', createApiRouter(io))
  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}
