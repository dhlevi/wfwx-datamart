import { Controller } from '../core/Controller'
import { Route, SuccessResponse, Get, Path, Query, NoCache, Cors } from '../core/Decorators'
import { ApiResponse } from '../core/model/ApiResponse'
import { StationsService } from '../services/StationsService'

const stationService = new StationsService()
@Route('stations')
export class StationsController extends Controller {
  @Get('/')
  @SuccessResponse('200', 'OK')
  @NoCache()
  @Cors({ origin: false })
  public async getStations (@Query('page') page: number, @Query('rows') rows: number, @Query('asGeojson') asGeojson: string, @Query('bbox') bbox: string, @Query('point') point: string, @Query('radius') radius: number, @Query('order') order: string) {
    try {
      page = page || 0
      rows = rows || 10
      const returnJson = asGeojson && (asGeojson.toLowerCase() === 'true' || asGeojson.toLowerCase() === 't' || asGeojson.toLowerCase() === '1' || asGeojson.toLowerCase() === 'y' || asGeojson.toLowerCase() === 'yes') || false
      console.log('Generate geojson: ' + returnJson)
      console.log('bbox: ' + bbox)
      return await stationService.getStations(page, rows, returnJson, bbox, point, radius, order)
    } catch (err) {
      console.error('Error executing getStations: ' + err)
      return new ApiResponse(500, 'Failed to execute query.') 
    }
  }

  @Get('/{code}')
  @SuccessResponse('200', 'OK')
  @NoCache()
  @Cors({ origin: false })
  public async getStation (@Path() code: string) {
    try {
      return await stationService.getStation(code)
    } catch (err) {
      console.error('Error executing getStation: ' + err)
      return new ApiResponse(500, 'Failed to execute query.') 
    }
  }
}
