import { Database } from "../postgres/Database"
import mybatisMapper = require('mybatis-mapper')
import path = require("path")
import { PagedResult } from "../core/model/PagedResult"

export class StationsService {
  public async getStations (page: number, rows: number, asGeojson: boolean, bbox: string, longLat: string, radius: number, order: string): Promise<any | undefined> {
    mybatisMapper.createMapper([path.resolve(__dirname, '../query-configs/station-queries.xml')])

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

    // orderby
    const orderby = order ? order.split(',') : []
    for (let i = 0; i < orderby.length; i++) {
      if (i < orderby.length - 1 && (orderby[i].toUpperCase() === 'ASC' || orderby[i].toUpperCase() === 'DESC')) {
        orderby[i] = orderby[i].toUpperCase() + ','
      }
    }

    // create query and fetch result
    const sql = mybatisMapper.getStatement('stations', 'stations_paged', { isCount: false, offset, rows, asGeojson, xmin, ymin, xmax, ymax, long, lat, radius, orderby }, {language: 'sql', indent: ' '})
    const result = await Database.query(sql)

    if (result && asGeojson) {
      return result.rows[0].json_build_object
    } else {
      const countSql = mybatisMapper.getStatement('stations', 'stations_paged', { isCount: true, offset: null, rows: null, asGeojson, xmin, ymin, xmax, ymax, long, lat, radius }, {language: 'sql', indent: ' '})
      const countResult = await Database.query(countSql)
      if (result) {
        return new PagedResult(page, rows, Math.ceil(Number(countResult?.rows[0].count) / rows), result.rows)
      } else {
        return new PagedResult(page, rows, 0, [])
      }
    }
  }

  public async getStation (code: string): Promise<any[] | undefined> {
    mybatisMapper.createMapper([path.resolve(__dirname, '../query-configs/station-queries.xml')])
    // create query and fetch result
    const sql = mybatisMapper.getStatement('stations', 'by_code', { code : code }, {language: 'sql', indent: ' '})
    const result = await Database.query(sql)
    if (result) {
      return result.rows
    } else {
      return []
    }
  }
}