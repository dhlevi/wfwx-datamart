import { RouteManager } from './RouteManager'
import cors = require('cors')
import {HttpStatusCodeLiteral, HttpStatusCodeStringLiteral, OtherValidOpenApiHttpStatusCode } from 'tsoa'
import { requiredScopes, validJWTNeeded } from '../middleware/AuthMiddleware'
import { noCache } from '../middleware/NoCacheMiddleware'
import multer = require('multer')

/*
 * The Decorators file creates functions used as decorators for your controllers
 * Decorators are those '@thing()' bits you see before class and function definitions
 * A decorator will apply on instantiation. Default decorators are overwrites of the
 * existing TSOA decorators and should be used in place of tsoa (which is only used for swagger).
 * Feel free to create your own as needed.
 */


/**
 * Apply Multer middleware to an endpoint for single file download. See
 * http://expressjs.com/en/resources/middleware/multer.html for multer options
 * @returns 
 */
export function UploadSingle (parameter: string, multerOptions?: multer.Options | undefined): Function {
  return function multipartDecorator(target: any, property: any, descriptor: any) {
    RouteManager.registerEndpointMiddleware(target, property, multer(multerOptions).single(parameter))
    return descriptor
  }
}

/**
 * Apply Multer middleware to an endpoint for file downloads. See
 * http://expressjs.com/en/resources/middleware/multer.html for multer options
 * @returns 
 */
export function UploadSingleArray (parameter: string, count: number, multerOptions?: multer.Options | undefined): Function {
  return function multipartDecorator(target: any, property: any, descriptor: any) {
    RouteManager.registerEndpointMiddleware(target, property, multer(multerOptions).array(parameter, count))
    return descriptor
  }
}

/**
 * Apply Multer middleware to an endpoint for file downloads. See
 * http://expressjs.com/en/resources/middleware/multer.html for multer options
 * @returns 
 */
export function MultiPartFormMixed (parameters: multer.Field[], multerOptions?: multer.Options | undefined): Function {
  return function multipartDecorator(target: any, property: any, descriptor: any) {
    RouteManager.registerEndpointMiddleware(target, property, multer(multerOptions).fields(parameters))
    return descriptor
  }
}

/**
 * Apply Multer middleware to an endpoint for file. See
 * http://expressjs.com/en/resources/middleware/multer.html for multer options
 * @returns 
 */
export function MultiPartFormText (): Function {
  return function multipartDecorator(target: any, property: any, descriptor: any) {
    RouteManager.registerEndpointMiddleware(target, property, multer().none())
    return descriptor
  }
}

/**
 * Apply NoCache middleware to an endpoint
 * @returns 
 */
export function NoCache (): Function {
  return function noCacheDecorator(target: any, property: any, descriptor: any) {
    RouteManager.registerEndpointMiddleware(target, property, noCache)
    return descriptor
  }
}

/**
 * Apply NoCache middleware to an endpoint
 * @returns 
 */
export function Cors (options?: cors.CorsOptions | cors.CorsOptionsDelegate<cors.CorsRequest> | undefined): Function {
  return function corsDecorator(target: any, property: any, descriptor: any) {
    RouteManager.registerEndpointMiddleware(target, property, cors(options))
    return descriptor
  }
}

/**
 * Indicator that this function handles a GET request, at the provided route
 * @param path The route to this request
 * @returns 
 */
export function Get (path: string): Function {
  return function getDecorator(target: any, property: any, descriptor: any) {
    const route = '/' + path.replace(/{/g, ':').replace(/}/g, '')
    RouteManager.registerEndpoint(target, property, route.replace(/\/\//g, '/').trim(), 'get')
    return descriptor
  }
}

/**
 * Indicator that this function handles a POST request, at the provided route
 * @param path The route to this request
 * @returns 
 */
export function Post (path: string): Function {
  return function postDecorator(target: any, property: any, descriptor: any) {
    const route = '/' + path.replace(/{/g, ':').replace(/}/g, '')
    RouteManager.registerEndpoint(target, property, route.replace(/\/\//g, '/').trim(), 'post')
    return descriptor
  }
}

/**
 * Indicator that this function handles a PUT request, at the provided route
 * @param path The route to this request
 * @returns 
 */
export function Put (path: string): Function {
  return function putDecorator(target: any, property: any, descriptor: any) {
    const route = '/' + path.replace(/{/g, ':').replace(/}/g, '')
    RouteManager.registerEndpoint(target, property, route.replace(/\/\//g, '/').trim(), 'put')
    return descriptor
  }
}

/**
 * Indicator that this function handles a PATCH request, at the provided route
 * @param path The route to this request
 * @returns 
 */
export function Patch (path: string): Function {
  return function patchDecorator(target: any, property: any, descriptor: any) {
    const route = '/' + path.replace(/{/g, ':').replace(/}/g, '')
    RouteManager.registerEndpoint(target, property, route.replace(/\/\//g, '/').trim(), 'patch')
    return descriptor
  }
}

/**
 * Indicator that this function handles a DELETE request, at the provided route
 * @param path The route to this request
 * @returns 
 */
export function Delete (path: string): Function {
  return function deleteDecorator(target: any, property: any, descriptor: any) {
    const route = '/' + path.replace(/{/g, ':').replace(/}/g, '')
    RouteManager.registerEndpoint(target, property, route.replace(/\/\//g, '/').trim(), 'delete')
    return descriptor
  }
}

/**
 * Indicator that this function handles a OPTIONS request, at the provided route
 * @param path The route to this request
 * @returns 
 */
export function Options (path: string): Function {
  return function optionsDecorator(target: any, property: any, descriptor: any) {
    const route = '/' + path.replace(/{/g, ':').replace(/}/g, '')
    RouteManager.registerEndpoint(target, property, route.replace(/\/\//g, '/').trim(), 'options')
    return descriptor
  }
}

/**
 * Defines the base route at this controller from the application root
 * An empty path will indicate top level
 * @param path The route to this request
 * @returns 
 */
export function Route (path: string): Function {
  return function routeDecorator(target: any) {
    const route = '/' + path
    RouteManager.registerController(target, route.replace(/\/\//g, '/').trim())
    return target
  }
}

/**
 * The expected success response
 * @param name Name or Number of the expected response code
 * @param description Description of the response
 * @param produces 
 * @returns 
 */
export function SuccessResponse (name: string | number, description?: string | undefined, produces?: string | string[] | undefined): Function {
  return function responseDecorator(target: any, property: any, descriptor: any) {
    RouteManager.registerEndpoint(target, property, null, null, name, description)
    return descriptor
  }
}

/**
 * Identify the expected response from this endpoint
 * @param name Name or Number of the expected response code
 * @param description Description of the response
 * @param example 
 * @param produces 
 * @returns 
 */
export function Response<ExampleType>(name: HttpStatusCodeLiteral | HttpStatusCodeStringLiteral | OtherValidOpenApiHttpStatusCode, description?: string, example?: ExampleType, produces?: string | string[]): Function {
  return function responseDecorator(target: any, property: any, descriptor: any) {
    // apply to route!
    return descriptor
  }
}

/**
 * Define the security params at this endpoint
 * @param name Type of security to implement
 * @param scopes Required Scopes
 * @returns 
 */
export function Security(name: string | { [name: string]: string[]; }, scopes?: string[] | undefined): Function {
  return function securityDecorator(target: any, property: any, descriptor: any) {
    if (name === 'BearerAuth') {
      const finalScopes = scopes ? scopes : []
      RouteManager.registerEndpointMiddleware(target, property, [validJWTNeeded, requiredScopes(finalScopes)])
    }
    // Other handler types for different authentication methods should be declared here. For now
    // I only care about supporting Bearer tokens/scopes with our webade implementation
    return descriptor
  }
}

/**
 * Explicit flag to ignore security on this endpoint
 * @param name Type of security to implement
 * @param scopes Required Scopes
 * @returns 
 */
export function NoSecurity(name: string | { [name: string]: string[]; }, scopes?: string[] | undefined): Function {
  return function securityDecorator(target: any, property: any, descriptor: any) {
    // ignored, used by tsoa
    return descriptor
  }
}

/**
 * Declare this attributes source to be on the Path string. If the path string
 * parameter will be different then then argument name, you can provide a name to
 * map to
 * @param name 
 * @returns 
 */
export function Path(name?: string | undefined): Function {
  return function pathDecorator(target: any, property: any, argIndex: any) {
    RouteManager.registerArgument(target, property, name, argIndex, 'path')
    return argIndex
  }
}

/**
 * Declare this attributes source to be on the query string. If the query string
 * parameter will be different then then argument name, you can provide a name to
 * map to
 * @param name 
 * @returns 
 */
export function Query(name?: string | undefined): Function {
  return function queryDecorator(target: any, property: any, argIndex: any) {
    RouteManager.registerArgument(target, property, name, argIndex, 'query')
    return argIndex
  }
}

/**
 * Declare this attributes source to be on the Body. If the body
 * parameter will be different then then argument name, you can provide a name to
 * map to
 * @param name 
 * @returns 
 */
export function Body(name?: string | undefined): Function {
  return function bodyDecorator(target: any, property: any, argIndex: any) {
    RouteManager.registerArgument(target, property, name, argIndex, 'body')
    return argIndex
  }
}

/**
 * Declare this attributes source to be the original Reqeust object.
 * The request object will also contain the body
 * @type An argument to extract from the request, usually for fetching multer files on upload
 * @returns 
 */
export function Request(type: string | null = null): Function {
  return function requestDecorator(target: any, property: any, argIndex: any) {
    RouteManager.registerArgument(target, property, undefined, argIndex, type || 'request')
    return argIndex
  }
}

/**
 * Adding a tag to the swagger document
 * @param values The list of tags
 * @returns 
 */
export function Tags (...values: string[]): Function {
  return function tagDecorator(target: any, property: any, descriptor: any) {
    // ignored, just for supplying tags on swagger via tsoa
    return descriptor
  }
}

/**
 * Adding an OperationId to the swagger document
 * @param id The operation id
 * @returns 
 */
export function OperationId (id: string): Function {
  return function idDecorator(target: any, property: any, descriptor: any) {
    // ignored, just for supplying opid on swagger via tsoa
    return descriptor
  }
}

/**
 * Flag an endpoint or argument as Deprecated
 * @returns 
 */
export function Deprecated (): Function {
  return function deprecatedDecorator(target: any, property: any, descriptor: any) {
    // ignored, just for supplying deprecation flag on swagger via tsoa
    // we don't want this to actually affect the transaction
    return descriptor
  }
}

/**
 * Register this endpoint, but do not add it to the generated swagger.
 * Only use this if you're really sure...
 * @returns 
 */
export function Hidden (): Function {
  return function hiddenDecorator(target: any, property: any, descriptor: any) {
    // ignored, just for supplying hidden flag on swagger via tsoa
    return descriptor
  }
}

/**
 * Declare this attributes source to be the file/files result from using one of
 * the multer multipart file uploads
 * @returns 
 */
export function FormField(name?: string): Function {
  return function fieldDecorator(target: any, property: any, argIndex: any) {
    RouteManager.registerArgument(target, property, name, argIndex, 'formField')
    return argIndex
  }
}

/**
 * Declare this attributes source to be the file/files result from using one of
 * the multer multipart file uploads
 * @returns 
 */
export function UploadedFiles(): Function {
  return function uploadFilesDecorator(target: any, property: any, argIndex: any) {
    RouteManager.registerArgument(target, property, undefined, argIndex, 'files')
    return argIndex
  }
}

/**
 * Declare this attributes source to be the file/files result from using one of
 * the multer multipart file uploads
 * @returns 
 */
export function UploadedFile(): Function {
  return function uploadFileDecorator(target: any, property: any, argIndex: any) {
    RouteManager.registerArgument(target, property, undefined, argIndex, 'files')
    return argIndex
  }
}

/**
 * Declare this attributes source to be a value from the request header
 * the multer multipart file uploads
 * @returns 
 */
export function Header(name?: string | undefined): Function {
  return function headerDecorator(target: any, property: any, argIndex: any) {
    RouteManager.registerArgument(target, property, name, argIndex, 'header')
    return argIndex
  }
}
