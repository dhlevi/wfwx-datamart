import { HealthService } from './../core/HealthService';
import { RouteManager } from './../core/RouteManager';
import * as express from 'express'
import * as swaggerUi from "swagger-ui-express"
import { StationsController } from '../controllers/StationsController'
import { HealthValidators } from '../middleware/HealthServiceMiddleware';
import { healthValidators } from '../health-checks/HealthCheckLoader';
import { ReadingsController } from '../controllers/ReadingsController';
console.info(' ### Starting Controller Processing and Route Definition ### ')
const router = express.Router();

// Register any default endpoints here. For now, we just have an openAPI public route
// openAPI.
console.info('Adding /openapi top level endpoint for swagger documentation ...')
const swaggerDocument = require('../public/swagger.json')
router.use('/openapi', swaggerUi.serve)
router.get('/openapi', swaggerUi.setup(swaggerDocument))

// Add a default health check endpoint
// Note, if you want the health check to be secure, add
// [validJWTNeeded, requiredScopes(['scope'])]
// to the get definition. Replace 'scope' with the scope you want to use
console.info('Adding /healthCheck top level endpoint ...')
router.get('/healthCheck', HealthValidators(
  ...healthValidators
), new HealthService().getHealth)
// Next, if you want your routes built, you need to instantiate your Controllers, like so:
console.info('Initializing controllers...')
if (!RouteManager.initControllers(new StationsController(), new ReadingsController())) {
  console.error('Some controllers may not have been created successfully. Please review route initialization.')
}
// Do the same for any other controllers you want routed
// from this point, the Decorators in your controller will automatically create a routing definition for you
// to get them initialized, use the RouteManager with your router:
if (!RouteManager.initializeRoutes(router)) {
  console.error('Route initialization completed with errors.')
}
// And now your endpoints will be registered with instructions provided from your decorators.
// if you don't use decorators or need to do something custom, you can add additional routes
// as needed in the standard express js way
// router.<method>('route', ...middleware, function)
// Now, we can create the top level endpoint
router.get('/', (_req: express.Request, res: express.Response, _next: express.NextFunction) => {
  res.status(200).json({
    service: 'WFWX Datamart API',
    links: [
      { method: 'GET', url: 'http://datamart/readings/hourlies'},
      { method: 'GET', url: 'http://datamart/readings/hourlies/statistics'},
      { method: 'GET', url: 'http://datamart/readings/dailies'},
      { method: 'GET', url: 'http://datamart/readings/dailies/statistics'},
      { method: 'GET', url: 'http://datamart/healthCheck'},
      { method: 'GET', url: 'http://datamart/openapi'}
    ]
  })
})

export default router
