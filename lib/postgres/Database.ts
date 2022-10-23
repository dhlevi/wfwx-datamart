import { Pool, QueryResult } from "pg"
import mybatisMapper = require('mybatis-mapper')

export class Database {
  private static _instance: Database
  private _initialized = false
  private pool: Pool | null = null

  private constructor () { /* empty */ }
  /**
   * The static method that controls the access to the webade singleton instance.
   */
  private static instance (): Database {
      if (!Database._instance) {
        Database._instance = new Database()
      }

      if (!Database._instance._initialized) {
        console.warn('Database currently uninitialized')
      }

      return Database._instance
  }

  public static connection (): Pool | null {
    return Database.instance().pool
  }

  public static async shutdown (): Promise<void> {
    return Database.instance().pool?.end()
  }

  public static async query (query: string): Promise<QueryResult<any> | undefined> {
    if (this.initialized() && Database.instance().pool !== null) {
      console.log('Executing query: ', query)
      const result = await Database.instance().pool?.query(query)
      return result
    }
  }

  // Static initializers and functions
  public static async initialize (): Promise<void> {
    return Database.instance().initialize()
  }

  public static initialized (): boolean {
    return Database.instance()._initialized
  }

  private initialize () {
    console.log('Initializing Database...')

    this.pool = new Pool()

    this._initialized = true
    console.log('Initialized')
  }

  // to use mybatis: 
  // mybatisMapper.createMapper([path.resolve(__dirname, '../query-configs/webade-queries.xml')])
  // let sql = mybatisMapper.getStatement('webade', 'application', { acronym : acronym }, {language: 'sql', indent: ' '})
}