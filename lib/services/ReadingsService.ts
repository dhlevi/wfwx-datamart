import { Database } from "../postgres/Database"
import mybatisMapper = require('mybatis-mapper')
import path = require("path")
import { ApiResponse } from "../core/model/ApiResponse"
import { PagedResult } from "../core/model/PagedResult"
import { RsqlToSqlConverter } from "@mw-experts/rsql"

export class ReadingsService {
  public async getReadings (page: number, rows: number, bbox: string, start: Date, end: Date, station: string, longLat: string, radius: number, order: string, query: string, daily: boolean): Promise<any> {
    mybatisMapper.createMapper([path.resolve(__dirname, '../query-configs/readings-queries.xml')])

    // Max of 31 days
    if (end.getTime() - start.getTime() > 2678400000) { 
      return new ApiResponse(400, 'Invalid date range. Queries cannot exceed 31 days. For bulk queries please download from the Datamart store') 
    }

    // calculate offset
    const offset = page * rows
    // Calculate bbox
    const coords = bbox ? bbox.split(",") : []
    let invalidBox = false
    if (coords.length != 4) {
      invalidBox = true
    } else {
      for (const coord of coords) {
        try {
          parseFloat(coord)
        } catch (err) {
          invalidBox = true
          break
        }
      }
    }

    let xmin, ymin, xmax, ymax = null
    if (!invalidBox) {
      xmin = parseFloat(bbox.split(",")[0])
			ymin = parseFloat(bbox.split(",")[1])
			xmax = parseFloat(bbox.split(",")[2])
			ymax = parseFloat(bbox.split(",")[3])
    }

    // validate point for radius search
    let long, lat = null
    if (invalidBox) {
      const coord = longLat ? longLat.split(',') : []
      if (coord.length === 2) {
        try {
          long = Number(coord[0])
          lat = Number(coord[1])
        } catch (err) {
          console.warn('Invalid coordinate supplied')
        }
      }
    }

    // handle rsql string
    let where = null
    if (query) {
      where = RsqlToSqlConverter.getInstance().convert(query)
      console.log('Appending RSQL query: ' + where)
    }

    // create query and fetch result
    const useInClause = station && station.includes(',')

    // orderby
    const orderby = order ? order.split(',') : []
    for (let i = 0; i < orderby.length; i++) {
      if (i < orderby.length - 1 && (orderby[i].toUpperCase() === 'ASC' || orderby[i].toUpperCase() === 'DESC')) {
        orderby[i] = orderby[i].toUpperCase() + ','
      }
    }

    let queryId = daily ? 'dailies_paged' : 'readings_paged'

    // && for intersect, @ for contains. We're using intersect on spatial queries... make optional?
    const sql = mybatisMapper.getStatement('readings', queryId, { isCount: false, offset, rows, start: start.getTime(), end: end.getTime(), xmin, ymin, xmax, ymax, station, useInClause, long, lat, radius, orderby, where }, { language: 'sql', indent: ' ' }).replace('& &', '&&')
    const result = await Database.query(sql)
    const countSql = mybatisMapper.getStatement('readings', queryId, { isCount: true, offset: null, rows: null, start: start.getTime(), end: end.getTime(), xmin, ymin, xmax, ymax, station, useInClause, long, lat, radius, where }, { language: 'sql', indent: ' ' }).replace('& &', '&&')
    const countResult = await Database.query(countSql)

    if (result) {
      return new PagedResult(page, rows, Math.ceil(Number(countResult?.rows[0].count) / rows), result.rows)
    } else {
      return new PagedResult(page, rows, 0, [])
    }
  }

  public async getStats (bbox: string, start: Date, end: Date, station: string, longLat: string, radius: number, query: string, daily: boolean): Promise<any> {
    mybatisMapper.createMapper([path.resolve(__dirname, '../query-configs/readings-queries.xml')])

    // Calculate bbox
    const coords = bbox ? bbox.split(",") : []
    let invalidBox = false
    if (coords.length != 4) {
      invalidBox = true
    } else {
      for (const coord of coords) {
        try {
          parseFloat(coord)
        } catch (err) {
          invalidBox = true
          break
        }
      }
    }

    let xmin, ymin, xmax, ymax = null
    if (!invalidBox) {
      xmin = parseFloat(bbox.split(",")[0])
			ymin = parseFloat(bbox.split(",")[1])
			xmax = parseFloat(bbox.split(",")[2])
			ymax = parseFloat(bbox.split(",")[3])
    }

    // validate point for radius search
    let long, lat = null
    if (invalidBox) {
      const coord = longLat ? longLat.split(',') : []
      if (coord.length === 2) {
        try {
          long = Number(coord[0])
          lat = Number(coord[1])
        } catch (err) {
          console.warn('Invalid coordinate supplied')
        }
      }
    }

    // handle rsql string
    let where = null
    if (query) {
      where = RsqlToSqlConverter.getInstance().convert(query)
      console.log('Appending RSQL query: ' + where)
    }

    // create query and fetch result
    const useInClause = station && station.includes(',')

    // && for intersect, @ for contains... make optional?
    const queryId = daily ? 'dailies_stats' : 'readings_stats'

    const sql = mybatisMapper.getStatement('readings', queryId, { isCount: false, start: start.getTime(), end: end.getTime(), xmin, ymin, xmax, ymax, station, useInClause, long, lat, radius, where }, { language: 'sql', indent: ' ' }).replace('& &', '&&')
    const result = await Database.query(sql)

    if (result) {
      return result.rows
    } else {
      return {}
    }
  }
}