import { Request, Response, NextFunction } from 'express'

/**
 * Middleware for setting no-cache headers
 * @param _ The Request
 * @param res The Response
 * @param next The next function to execute
 */
export function noCache (_: Request, res: Response, next: NextFunction) {
  res.setHeader('Expires', '0')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
  next()
}
