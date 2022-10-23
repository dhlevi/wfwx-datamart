/**
 * Simple interface for the Health Validator Class
 */
export interface IHealthValidator {
  status: HealthStatus
  name: string | null
  description: string | null
  message: string | null
}

/**
 * Health Validation base class. This is used for creating new Health Checks
 * Health checks must extend this class and override validate to be useful
 */
export class HealthValidator implements IHealthValidator {
  public status: HealthStatus = HealthStatus.GREEN
  public name: string | null = null
  public description: string | null = null
  public message: string | null = null
  
  /**
   * Execute the Health Check validator
   */
  public async validate () { /* overridable */ }

  /**
   * Fetch the health check results. This is only meaningful after running the validator
   * @returns Health results
   */
  public getResults () {
    return {
      name: this.name,
      description: this.description,
      status: this.status,
      message: this.message
    }
  }
}

/**
 * Enumerator for the Health Status used in Health Checks
 */
export enum HealthStatus {
  GREEN = 'Running',
  YELLOW = 'Warning',
  RED = 'Failure'
}