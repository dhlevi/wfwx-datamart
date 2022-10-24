import { Controller } from '../core/Controller'
import { Route, SuccessResponse, Get, Path, Query, NoCache, Cors } from '../core/Decorators'
import { ApiResponse } from '../core/model/ApiResponse'
import { ReadingsService } from '../services/ReadingsService'

const readingsService = new ReadingsService()
@Route('readings')
export class ReadingsController extends Controller {
  @Get('/')
  @SuccessResponse('200', 'OK')
  @NoCache()
  @Cors({ origin: false })
  public async getReadings (@Query('page') page: number, @Query('rows') rows: number, @Query('bbox') bbox: string, @Query('start') start: string, @Query('end') end: string, @Query('stations') stations: string, @Query('point') point: string, @Query('radius') radius: number, @Query('order') order: string, @Query('query') query: string) {
    try {
      page = page || 0
      rows = rows || 2000
      const startDate = start ? new Date(Date.parse(start)) : new Date(Date.now() - (1000 * 60 * 60 * 24)) // now, minus 24 hours
      const endDate = end ? new Date(Date.parse(end)) : new Date()
      return readingsService.getReadings(page, rows, bbox, startDate, endDate, stations, point, radius, order, query, false)
    } catch (err) {
      console.error('Error executing getReadings: ' + err)
      return new ApiResponse(500, 'Failed to execute query.') 
    }
  }

  @Get('/dailies')
  @SuccessResponse('200', 'OK')
  @NoCache()
  @Cors({ origin: false })
  public async getReadingsDailies (@Query('page') page: number, @Query('rows') rows: number, @Query('bbox') bbox: string, @Query('start') start: string, @Query('end') end: string, @Query('stations') stations: string, @Query('point') point: string, @Query('radius') radius: number, @Query('order') order: string, @Query('query') query: string) {
    try {
      page = page || 0
      rows = rows || 2000
      const startDate = start ? new Date(Date.parse(start)) : new Date(Date.now() - (1000 * 60 * 60 * 24)) // now, minus 24 hours
      const endDate = end ? new Date(Date.parse(end)) : new Date()
      return readingsService.getReadings(page, rows, bbox, startDate, endDate, stations, point, radius, order, query, true)
    } catch (err) {
      console.error('Error executing getDailies: ' + err)
      return new ApiResponse(500, 'Failed to execute query.') 
    }
  }

  @Get('/statistics')
  @SuccessResponse('200', 'OK')
  @NoCache()
  @Cors({ origin: false })
  public async getReadingsStats (@Query('bbox') bbox: string, @Query('start') start: string, @Query('end') end: string, @Query('stations') stations: string, @Query('point') point: string, @Query('radius') radius: number, @Query('query') query: string) {
    try {
      const startDate = start ? new Date(Date.parse(start)) : new Date(Date.now() - (1000 * 60 * 60 * 24)) // now, minus 24 hours
      const endDate = end ? new Date(Date.parse(end)) : new Date()
      return readingsService.getStats(bbox, startDate, endDate, stations, point, radius, query, false)
    } catch (err) {
      console.error('Error executing statistics: ' + err)
      return new ApiResponse(500, 'Failed to execute query.') 
    }
  }

  @Get('/dailies/statistics')
  @SuccessResponse('200', 'OK')
  @NoCache()
  @Cors({ origin: false })
  public async getReadingsDailiesStats (@Query('bbox') bbox: string, @Query('start') start: string, @Query('end') end: string, @Query('stations') stations: string, @Query('point') point: string, @Query('radius') radius: number, @Query('query') query: string) {
    try {
      const startDate = start ? new Date(Date.parse(start)) : new Date(Date.now() - (1000 * 60 * 60 * 24)) // now, minus 24 hours
      const endDate = end ? new Date(Date.parse(end)) : new Date()
      return readingsService.getStats(bbox, startDate, endDate, stations, point, radius, query, true)
    } catch (err) {
      console.error('Error executing dailies statistics: ' + err)
      return new ApiResponse(500, 'Failed to execute query.') 
    }
  }
}
