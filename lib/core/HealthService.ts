import * as express from 'express'
import * as os from 'os'
import { HealthStatus } from './model/HealthValidator';

/**
 * A Health Service function. This is the handler for the default
 * healthCheck endpoint. When executed this checker will fire the
 * validate functions on all supplied validators and return the
 * results. See the ./health-checks folder which includes the
 * HealthCheckLoader.ts where you can register new checks.
 */
export class HealthService {
  public async getHealth (req: express.Request, res: express.Response, next: express.NextFunction) {
    try {
      const validators = (req as any).validators
      const healthCheckResult = {
        status: HealthStatus.GREEN,
        memoryAvailable: Math.ceil(os.totalmem() / 1000000) - Math.ceil((os.totalmem() - os.freemem()) / 1000000),
        otherModules: []
      }

      const promises = []
      for (const validator of validators) {
        promises.push(validator.validate())
      }

      await Promise.all(promises)

      for (const validator of validators) {
        healthCheckResult.otherModules.push(validator.getResults() as never)
        if ((healthCheckResult.status === HealthStatus.GREEN && validator.status !== HealthStatus.GREEN) ||
            (healthCheckResult.status === HealthStatus.YELLOW && validator.status === HealthStatus.RED)) {
          healthCheckResult.status = validator.status
        }
      }

      res.status(200).json(healthCheckResult)
    } catch (err) {
      console.error('Route Handler reported error from execution of health check: ' + err)
      next(err)
    }
  }
}