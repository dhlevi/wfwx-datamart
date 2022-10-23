import { Controller } from './Controller';
import { Router } from "express"
import * as express from 'express'
import { ApiResponse } from './model/ApiResponse';

/**
 * The RouteManager is a Singleton control for the creation and registration of API Routes
 * This should only be called via applying Decorators to your Controller classes. As you add
 * Decorators to your class, functions and function arguments, the Route Definitions will be
 * created and updated. Once your controllers are instantiated the routes will be generated
 * and applied to the server.
 * Note: This is a singleton for now, but it will likey change in the near future. Doesn't
 * change how you use it, mind you, but the "better" way to do this instead of singleton would
 * be to apply the decorator attributes on controller prototype and inject directly later. The
 * singleton is a convinience
 */
export class RouteManager {
  private static _instance: RouteManager
  private controllers: Map<string, RouteDefintion> = new Map<string, RouteDefintion>()
  private initialized = false


  // Singleton pattern requires a private constructor to prevent instantiation
  private constructor () { /* empty */ }
  /**
   * The static method that controls the access to the Properties singleton instance.
   * Private for this singleton so other classes are forced to use the static implementation
   */
  private static instance (): RouteManager {
      if (!RouteManager._instance) {
        RouteManager._instance = new RouteManager()
      }
      return RouteManager._instance
  }

  /**
   * Initialize the routes from the provided controller
   * details. Can only be done once.
   * @param router The router to configure with
   * @returns result
   */
  public static initializeRoutes (router: Router): boolean {
    console.info('Initializing Routes:')
    return RouteManager.instance().initializeRoutes(router)
  }

  public static initControllers (...controllers: Array<Controller>): boolean {
    let result = true
    for (const controller of controllers) {
      const name = Object.prototype.hasOwnProperty.call(controller, 'name') ? (controller as any).name : controller.constructor.name
      result = result && RouteManager.instance().controllers.has(name)
      // currently just verifies the decorator functions applied the controller and endpoints configs
      // into the singleton. This will be replaced later to check controller.prototype for embedded
      // configs and the singleton approach will be removed
    }
    return result
  }

  /**
   * Register a controller on the Route Manager
   * @param target The target controller class
   * @param route 
   * @returns 
   */
  public static registerController (target: Controller, route: string | null = null): boolean {
    return RouteManager.instance().registerController(target, route)
  }

  /**
   * Register an endpoint on the route manager. An endpoint must be a function of a
   * Controller class
   * @param target 
   * @param property 
   * @param route 
   * @param type 
   * @param success 
   * @param successDescription 
   * @returns 
   */
  public static registerEndpoint (target: Controller, property: string, route: string | null = null, type: string | null = null, success: number | string | null = null, successDescription: string | null = null): boolean {
    const regController = RouteManager.instance().registerController(target)
    const regEndpoint = RouteManager.instance().registerEndpoint(target, property, route, type, success, successDescription)
    return regController && regEndpoint
  }

  /**
   * Register an endpoint middleware processor. This will be applied to the created route
   * @param target 
   * @param property 
   * @param middleware 
   * @returns 
   */
  public static registerEndpointMiddleware(target: Controller, property: string, middleware: any) {
    const regController = RouteManager.instance().registerController(target)
    const regEndpoint = RouteManager.instance().registerEndpoint(target, property)
    const regMiddleware = RouteManager.instance().registerMiddleware(target, property, middleware)
    return regController && regEndpoint && regMiddleware
  }

  /**
   * Register an endpoint argument. The argument must be an argument on the endpoint function
   * and a valid index is required or mappings may become crossed. If the api argument is different
   * then the function argument, supply a requestProperty override.
   * @param target 
   * @param property 
   * @param requestProperty 
   * @param argIndex 
   * @param type 
   * @returns 
   */
  public static registerArgument (target: Controller, property: string, requestProperty: string | undefined, argIndex: number, type: string): boolean {
    const regController = RouteManager.instance().registerController(target)
    const regEndpoint = RouteManager.instance().registerEndpoint(target, property)
    const regArgument = RouteManager.instance().registerArgument(target, property, requestProperty, argIndex, type)
    return regController && regEndpoint && regArgument
  }

  public initializeRoutes (router: Router): boolean {
    try {
      if (this.initialized) {
        throw new Error('Routes already initialized.')
      }
      // iterate the controllers and create a route on the router for each one
      for (const [key, controller] of this.controllers.entries()) {
        console.log('Building routes for controller: ' + key)
        for (const endpoint of controller.endpoints) {
          let route = controller.route + endpoint.route
          route = route.replace(/\/\//g, '/').trim()
          console.log(`Creating ${endpoint.type.toUpperCase()} route for ${controller.name + '.' + endpoint.name} @ ${route}`)
          if (endpoint.type === 'get') {
            router.get(route, ...endpoint.middleware, buildRouteHandler(endpoint.endpointFunc, endpoint.success, endpoint.parameters))
          } else if (endpoint.type === 'post') {
            router.post(route, ...endpoint.middleware, buildRouteHandler(endpoint.endpointFunc, endpoint.success, endpoint.parameters))
          } else if (endpoint.type === 'put') {
            router.put(route, ...endpoint.middleware, buildRouteHandler(endpoint.endpointFunc, endpoint.success, endpoint.parameters))
          } else if (endpoint.type === 'patch') {
            router.patch(route, ...endpoint.middleware, buildRouteHandler(endpoint.endpointFunc, endpoint.success, endpoint.parameters))
          } else if (endpoint.type === 'delete') {
            router.delete(route, ...endpoint.middleware, buildRouteHandler(endpoint.endpointFunc, endpoint.success, endpoint.parameters))
          } else if (endpoint.type === 'options') {
            router.options(route, ...endpoint.middleware, buildRouteHandler(endpoint.endpointFunc, endpoint.success, endpoint.parameters))
          }
        }
      }
    } catch (err) {
      console.error(err)
      return false
    }
    this.initialized = true
    return true
  }

  public registerController (target: Controller, route: string | null = null): boolean {
    try {
      // find the declared controller or add a new one if it doesn't exist
      const name = Object.prototype.hasOwnProperty.call(target, 'name') ? (target as any).name : target.constructor.name
      let controllerDef = this.controllers.get(name)
      if (!controllerDef) {
        controllerDef = new RouteDefintion()
        controllerDef.name = name
        controllerDef.controller = target
        this.controllers.set(name, controllerDef)
      }
      // set the route, if it's supplied
      if (route) {
        controllerDef.route = route
      }
      // other refs might be internal or indirect. This will be the defined root class
      if (Object.prototype.hasOwnProperty.call(target, 'name')) {
        controllerDef.controller = target
      }
    } catch (err) {
      console.error(err)
      return false
    }
    return true
  }

  public registerEndpoint (target: Controller, property: string, route: string | null = null, type: string | null = null, success: number | string | null = null, successDescription: string | null = null): boolean {
    try {
      // find the declared controller or add a new one if it doesn't exist
      const controllerDef = this.controllers.get(target.constructor.name)
      if (controllerDef) {
        let endpoint = controllerDef.endpoints.find(e => e.name === property)
        if (!endpoint) {
          endpoint = new EndpointDefinition()
          endpoint.name = property
          endpoint.endpointFunc = (target as any)[property]
          controllerDef.endpoints.push(endpoint)
        }
        // define route and type, if supplied
        if (route && type) {
          endpoint.type = type
          endpoint.route = route
        }

        if (success) {
          endpoint.success = success
        }

        if (successDescription) {
          endpoint.successDescription = successDescription
        }
      } else {
        throw new Error(`Controller ${target.constructor.name} has no defined handler`)
      }
    } catch (err) {
      console.error(err)
      return false
    }
    return true
  }

  public registerMiddleware (target: Controller, property: string, middleware: any): boolean {
    try {
      // find the declared controller or add a new one if it doesn't exist
      const controllerDef = this.controllers.get(target.constructor.name)
      if (controllerDef) {
        const endpoint = controllerDef.endpoints.find(e => e.name === property)
        if (!endpoint) {
          throw new Error(`Endpoint ${property} has no definition handler`)
        }
        // register middleware on the endpoint
        endpoint.middleware.push(middleware)
      } else {
        throw new Error(`Controller ${target.constructor.name} has no defined handler`)
      }
    } catch (err) {
      console.error(err)
      return false
    }
    return true
  }

  public registerArgument (target: Controller, property: string, requestProperty: string | undefined, argIndex: number, type: string): boolean {
    try {
      // find the declared controller or add a new one if it doesn't exist
      const controllerDef = this.controllers.get(target.constructor.name)
      if (controllerDef) {
        const endpoint = controllerDef.endpoints.find(e => e.name === property)
        if (endpoint) {
          if (endpoint.parameters.find(p => p.index === argIndex)) {
            throw new Error('A duplicate parameter index has been defined. Parameter ignored.')
          }

          const param = new ParameterDefinition()
          param.type = type
          param.index = argIndex

          // extract the function argument from the target so we can determine the correct name
          const func = (target as any)[property]
          const funcString = func.toString().replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/(.)*/g, '').replace(/{[\s\S]*}/, '').replace(/=>/g, '').trim()
          const funcArgs = funcString.substring(funcString.indexOf("(") + 1, funcString.length - 1).split(", ")

          param.name = funcArgs[argIndex]
          param.argName = requestProperty || param.name // if no override name is provided, assume the param name and argument are the same

          endpoint.parameters.push(param)
        } else {
          throw new Error(`Endpoint ${property} has no defined handler`)
        }
      } else {
        throw new Error(`Controller ${target.constructor.name} has no defined handler`)
      }
    } catch (err) {
      console.error(err)
      return false
    }
    return true
  }
}

/*
 * Route definition model for Primary controller, endpoint, and arguments
 */

export class RouteDefintion {
  public name: string = ''
  public controller: any = null
  public route: string = ''
  public endpoints: Array<EndpointDefinition> = []
}

export class EndpointDefinition {
  public name: string = ''
  public endpointFunc: Function | null = null
  public route: string = ''
  public type: string = ''
  public parameters: Array<ParameterDefinition> = []
  public middleware: Array<any> = []
  public success: number | string = 200
  public successDescription: string = 'OK'
}

export class ParameterDefinition {
  public name: string = ''
  public argName: string = ''
  public type: string = ''
  public index: number = -1
}

/**
 * The buildRouteHander is a specialized function used to assist
 * with parsing your service constroller functions for auto-mapping
 * attributes to path, query and body params.
 */
function buildRouteHandler (func: Function | null, status: number | string, parameters: Array<ParameterDefinition>) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      // Extract the function arguments
      // const funcString = func.toString().replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/(.)*/g, '').replace(/{[\s\S]*}/, '').replace(/=>/g, '').trim()
      // const funcArgs = funcString.substring(funcString.indexOf("(") + 1, funcString.length - 1).split(", ")
      // Probably not needed, unless we wanted to verify the name of the argument

      // Create an args array of the same length as our function parameters
      // and pre-fill them with undefined values
      const args = Array.from(Array(parameters.length))
      // iterate over our parameter list for this endpoint and 
      // apply values as needed
      for (const param of parameters) {
        if (param.type === 'path') {
          args[param.index] = req.params[param.argName] || null
        } else if (param.type === 'query') {
          args[param.index] = req.query[param.argName] || null
        } else if (param.type === 'body') {
          args[param.index] = req.body
        } else if (param.type === 'request') {
          args[param.index] = req
        } else if (param.type === 'formField') {
          args[param.index] = req.body[param.argName] || null
        } else if (param.type === 'files') {
          args[param.index] = Object.prototype.hasOwnProperty.call(req, 'file') ? req.file :
                              Object.prototype.hasOwnProperty.call(req, 'files') ? req.files :
                              null
        } else if (param.type === 'header') {
          args[param.index] = req.headers[param.argName] || null
        } else {
          args[param.index] = (req as any)[param.type] || null
        }
      }

      // handle the endpoint function with the defined arguments
      if (func !== null) {
        const result = await func(...args)

        // Returning an API Response object will override
        // the provided default response code
        if (result instanceof ApiResponse) {
          res.status(result.status).json(result.responseBody)
        } else {
          // return the status and resulting json message
          const finalStatus = typeof status === 'string' ? parseInt(status) : status
          res.status(finalStatus).json(result)
        }
      }
    } catch (err) {
      console.error('Route Handler reported error from execution of ' + (func ? func.name : 'Undefined Callback') + ': ' + err)
      next(err)
    }
  }
}
