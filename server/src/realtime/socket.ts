import type { Server as HttpServer } from 'http'
import { Server } from 'socket.io'
import { env } from '../config/env.js'

export function createSocketServer(httpServer: HttpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      methods: ['GET', 'POST'],
    },
  })

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('subscribe', (keywords: string[]) => {
      keywords.forEach((keyword) => socket.join(`keyword:${keyword}`))
      console.log(`Socket ${socket.id} subscribed to:`, keywords)
    })

    socket.on('unsubscribe', (keywords: string[]) => {
      keywords.forEach((keyword) => socket.leave(`keyword:${keyword}`))
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })

  return io
}
