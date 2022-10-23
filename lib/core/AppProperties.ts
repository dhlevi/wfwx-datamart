import PropertiesReader = require('properties-reader')

/**
 * Application properties helper singleton class. Initialized on application startup
 *
 * You may be asking yourself, why does this even exist? Well, the main purpose is to load in
 * the properties file once, and allow access to it easily throughout the application without
 * reloading it. You could always call properties reader directly if you want to load in a
 * custom properties file.
 * A singleton pattern is "ok" in this situation as the App Properties are a shared resource
 * We could always pass it through where needed to avoid a singleton
 */
export class AppProperties {
  private static _instance: AppProperties
  private properties

  // Singleton pattern requires a private constructor to prevent instantiation
  private constructor () { 
    this.properties = PropertiesReader('config/application.properties')
  }
  /**
   * The static method that controls the access to the Properties singleton instance.
   */
  public static instance (): AppProperties {
      if (!AppProperties._instance) {
        AppProperties._instance = new AppProperties()
      }
      return AppProperties._instance
  }

  /*
   * Static form of the Get call below, to save on typing 'instance' every time
   */
  public static get (propertyName: string):  string | number | boolean | null {
    return AppProperties.instance().get(propertyName)
}

  /*
   * Get the property by key. Thin wrapper around the PropertiesReader Get
   */
  public get (propertyName: string):  string | number | boolean | null {
      return this.properties.get(propertyName)
  }
}