import * as express from 'express'
import { Express } from 'express'
import { Server } from 'http'
import * as compress from 'compression'
import * as bodyParser from 'body-parser'
import * as helmet from 'helmet'
import router from './routes/Routes'
import { ValidateError } from 'tsoa'

/**
 * Abstraction around the raw Express.js server and Nodes' HTTP server.
 * Defines HTTP request mappings, basic as well as request-mapping-specific
 * middleware chains for application logic, config and everything else.
 */
export class ExpressServer {
  // Server
  private server?: Express
  private httpServer?: Server

  constructor () { /* empty */ }

  /**
   * Initialize the Express Server. This will create the server
   * and apply default middleware, then create the listener.
   * @param port The port to listen on
   * @returns A promise to return the initialized Express Server
   */
  public async setup (port: number): Promise<Express> {
    const server = express()
    // setup path to static content
    server.use(express.static('/public'))
    // setup middleware
    this.setupSecurityMiddlewares(server)
    this.setupStandardMiddlewares(server)
    // configure endpoints (call router plus anything else needed)
    this.configureApiEndpoints(server)
    // Configure validator/error message responder
    server.use(function errorHandler(err: unknown, req: express.Request, res: express.Response, next: express.NextFunction): express.Response | void {
      if (err instanceof ValidateError) {
        console.warn(`Caught Validation Error for ${req.path}:`, err.fields)
        // You could replace with a message resource
        return res.status(422).json({
          message: "Validation Failed",
          details: err?.fields
        })
      }
      if (err instanceof Error) {
        return res.status(500).json({
          message: "Internal Server Error",
        })
      }
      next()
    })
    // Configure a default 404 handler
    server.use(function notFoundHandler(_req: express.Request, res: express.Response) {
      res.status(404).send({
        message: "Not Found"
      })
    })
    // activate the listener
    this.httpServer = this.listen(server, port)
    this.server = server

    return this.server
  }

  /**
   * Establish the listener
   * @param server The express server to listen with
   * @param port The port to listen on
   * @returns The Server that will be listening for events
   */
  public listen (server: Express, port: number): Server {
    return server.listen(port)
  }

  /**
   * Terminate the listener
   */
  public kill () {
    if (this.httpServer) this.httpServer.close()
  }

  /**
   * Standard default middleware setup. Currently only
   * for Bodyparser and compress
   * @param server The express server
   */
  private setupStandardMiddlewares (server: Express) {
    server.use(bodyParser.json())
    server.use(compress())
  }

  /**
   * Standard default middleware for security (helmut)
   * @param server The express server
   */
  private setupSecurityMiddlewares (server: Express) {
    server.use(helmet())
    server.use(helmet.referrerPolicy({ policy: 'same-origin' }))
    server.use(helmet.contentSecurityPolicy({
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'unsafe-inline'"],
        scriptSrc: ["'unsafe-inline'", "'self'"]
      }
    }))
    
    server.use(helmet.crossOriginEmbedderPolicy());
    server.use(helmet.crossOriginOpenerPolicy());
    server.use(helmet.crossOriginResourcePolicy());
    server.use(helmet.dnsPrefetchControl());
    server.use(helmet.expectCt());
    server.use(helmet.frameguard());
    server.use(helmet.hidePoweredBy());
    server.use(helmet.hsts());
    server.use(helmet.ieNoOpen());
    server.use(helmet.noSniff());
    server.use(helmet.originAgentCluster());
    server.use(helmet.permittedCrossDomainPolicies());
    server.use(helmet.referrerPolicy());
    server.use(helmet.xssFilter());

    server.disable('x-powered-by');
    server.use(function (req, res, next) {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE, HEAD');
      res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-Type,Authorization,responseType');
      res.setHeader('Access-Control-Expose-Headers', 'x-total-count,x-pending-comment-count,x-next-comment-id');
      res.setHeader('Cache-Control', 'max-age=4');
      next();
    });
  }

  /**
   * Initialize the servers endpoints. This function will allow you to map
   * your endpoint providers functions to a server endpoint. This can easily
   * be broken up if needed
   * @param server The express server
   */
  private configureApiEndpoints (server: Express) {
    server.use(router)
  }
}
