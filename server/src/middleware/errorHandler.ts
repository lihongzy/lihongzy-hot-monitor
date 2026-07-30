import type { ErrorRequestHandler, RequestHandler } from 'express'

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` })
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error('Unhandled server error:', error)
  res.status(500).json({ error: 'Internal server error' })
}
