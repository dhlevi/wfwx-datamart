import { HealthStatus, HealthValidator } from '../core/model/HealthValidator'
import { Database } from '../postgres/Database'

/**
 * An example Health Check Validator that will verify that the Webade system has been initialized
 * and the Webade database is available.
 */
export class DBHealthCheck extends HealthValidator {
  constructor () {
    super()
    this.name = 'Datamart DB'
    this.description = 'Datamart Database'
  }

  public async validate () {
    this.status = HealthStatus.GREEN
    this.message = 'Datamart is available'

    if (!Database.initialized()) {
      this.status = HealthStatus.YELLOW
      this.message = 'Datamart could not be initialized'
    }

    try {
      const result = await Database.query('SELECT NOW()')
    } catch (err) {
      this.status = HealthStatus.RED
      this.message = 'Failed to connect to the Datamart database: ' + err
    }
  }
}