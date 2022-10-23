import { Database } from "../postgres/Database"
import mybatisMapper = require('mybatis-mapper')
import path = require("path")
import { ApiResponse } from "../core/model/ApiResponse"
import { PagedResult } from "../core/model/PagedResult"

export class ReadingsService {
  public async getReadings (page: number, rows: number, bbox: string, start: Date, end: Date, station: string, longLat: string, radius: number, order: string): Promise<any> {
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

    // create query and fetch result
    const useInClause = station && station.includes(',')

    // orderby
    const orderby = order ? order.split(',') : []
    for (let i = 0; i < orderby.length; i++) {
      if (i < orderby.length - 1 && (orderby[i].toUpperCase() === 'ASC' || orderby[i].toUpperCase() === 'DESC')) {
        orderby[i] = orderby[i].toUpperCase() + ','
      }
    }

    const sql = mybatisMapper.getStatement('readings', 'readings_paged', { isCount: false, offset, rows, start: start.getTime(), end: end.getTime(), xmin, ymin, xmax, ymax, station, useInClause, long, lat, radius, orderby }, { language: 'sql', indent: ' ' })
    const result = await Database.query(sql)
    const countSql = mybatisMapper.getStatement('readings', 'readings_paged', { isCount: true, offset: null, rows: null, start: start.getTime(), end: end.getTime(), xmin, ymin, xmax, ymax, station, useInClause, long, lat, radius }, { language: 'sql', indent: ' ' })
    const countResult = await Database.query(countSql)
    if (result) {
      return new PagedResult(page, rows, Math.ceil(Number(countResult?.rows[0].count) / rows), result.rows)
    } else {
      return new PagedResult(page, rows, 0, [])
    }
  }

  public async getDailies (page: number, rows: number, bbox: string, start: Date, end: Date, station: string, longLat: string, radius: number, order: string): Promise<any> {
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

    // create query and fetch result
    const useInClause = station && station.includes(',')

    // orderby
    const orderby = order ? order.split(',') : []
    for (let i = 0; i < orderby.length; i++) {
      if (i < orderby.length - 1 && (orderby[i].toUpperCase() === 'ASC' || orderby[i].toUpperCase() === 'DESC')) {
        orderby[i] = orderby[i].toUpperCase() + ','
      }
    }

    const sql = mybatisMapper.getStatement('readings', 'dailies_paged', { isCount: false, offset, rows, start: start.getTime(), end: end.getTime(), xmin, ymin, xmax, ymax, station, useInClause, long, lat, radius, orderby }, { language: 'sql', indent: ' ' })
    const result = await Database.query(sql)
    const countSql = mybatisMapper.getStatement('readings', 'dailies_paged', { isCount: true, offset: null, rows: null, start: start.getTime(), end: end.getTime(), xmin, ymin, xmax, ymax, station, useInClause, long, lat, radius }, { language: 'sql', indent: ' ' })
    const countResult = await Database.query(countSql)
    if (result) {
      return new PagedResult(page, rows, Math.ceil(Number(countResult?.rows[0].count) / rows), result.rows)
    } else {
      return new PagedResult(page, rows, 0, [])
    }
  }
}