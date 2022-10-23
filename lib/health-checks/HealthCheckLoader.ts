import { HealthValidator } from "../core/model/HealthValidator";
import { DBHealthCheck } from "./DBHealthCheck";
/*
 * The Health Check loader is an array of validators that
 * you want run when the healthCheck endpoint is hit.
 * Obviously you can add additional health checks here
 * just instantiate a HealthValidator below and it'll be
 * added to the health check.
 * Health check classes must extend the HealthValidator class
 * and do something in the validate function to be useful.

 */

export const healthValidators: Array<HealthValidator> = [
  new DBHealthCheck()
]