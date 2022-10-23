import { Request, Response, NextFunction } from 'express'
import { HealthValidator } from '../core/model/HealthValidator'

/**
 * Middleware for setting health validators
 * You never need to use this, it's only used by the health check endpoint
 */
export function HealthValidators (...validators: Array<HealthValidator>) {
  return (req: Request, _res: Response, next: NextFunction) => {
    (req as any).validators = validators
    return next()
  }
}
