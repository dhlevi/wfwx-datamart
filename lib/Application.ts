import { TaskManager } from './core/TaskManager'
import { ExpressServer } from './ExpressServer'
import { Database } from './postgres/Database'

/**
 * Wrapper around the Node process, ExpressServer abstraction and complex dependencies such as services that ExpressServer needs.
 */

export class Application {
  /**
   * Create the Express Server and initialize
   * @param port The port number to run the server on
   * @returns A promise to return the Express Server instance that was created
   */
  public static async createApplication (port: number): Promise<ExpressServer> {
    const expressServer = new ExpressServer()
    await expressServer.setup(port)
    Application.handleExit(expressServer)

    return expressServer
  }

  /**
   * Cleanly handle the express server shutdown
   * @param express The Express Server to shut down
   */
  private static handleExit (express: ExpressServer) {
    // Attach exception handlers to the process
    // uncaught exceptions/rejections might not trigger
    // a clean shutdown, but it's worth showing as an
    // example for handling these events
    process.on('uncaughtException', (err: Error) => {
      console.error('Uncaught exception', err)
      Application.cleanShutdown(1, express)
    })
    process.on('unhandledRejection', (reason: {} | null | undefined) => {
      console.error('Unhandled Rejection at promise', reason)
      Application.cleanShutdown(2, express)
    })
    process.on('SIGINT', () => {
      console.info('Caught SIGINT')
      Application.cleanShutdown(128 + 2, express)
    })
    process.on('SIGTERM', () => {
      console.info('Caught SIGTERM')
      Application.cleanShutdown(128 + 2, express)
    })
    process.on('exit', () => {
      console.info('Exiting')
    })
  }

  /**
   * Handler for cleanly shutting the service down. Should only be triggered
   * from the exit handler
   * @param exitCode The exit code to return
   * @param express The express server that is shutting down
   */
  private static cleanShutdown (exitCode: number, express: ExpressServer) {
    Promise.resolve()
    .then(() => express.kill())
    .then(() => {
      TaskManager.clearTasks()
      Database.shutdown()
      console.info('Shutdown complete')
      process.exit(exitCode)
    })
    .catch(err => {
      console.error('Error during shutdown', err)
      process.exit(1)
    })
  }
}
