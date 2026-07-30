import { Router } from 'express'
import type { Server } from 'socket.io'
import { createChecksRouter } from './checks.js'
import hotspotsRouter from './hotspots.js'
import keywordsRouter from './keywords.js'
import notificationsRouter from './notifications.js'
import settingsRouter from './settings.js'

export function createApiRouter(io: Server) {
  const router = Router()

  router.use('/keywords', keywordsRouter)
  router.use('/hotspots', hotspotsRouter)
  router.use('/settings', settingsRouter)
  router.use('/notifications', notificationsRouter)
  router.use('/check-hotspots', createChecksRouter(io))

  return router
}
