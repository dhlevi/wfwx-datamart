import axios from 'axios'
import { AppProperties } from "../core/AppProperties"
import { Task } from "../core/model/Task"
import { Database } from "../postgres/Database"

const MAX_BACKFILL_DAYS = Number(AppProperties.get('backfill.days') || 5)

export const scheduledTasks: Task[] = [
  // normally you'd move this function into a seperate class and just bind it here
  new Task('Load from Datamart', '50 * * * *', async () => {
    console.log('Starting datamart update')
    // Every hour, 50 minutes past, we should fetch the latest data from the datamart
    let now = new Date()
    let daysChecked = 0
    while (daysChecked < MAX_BACKFILL_DAYS) {
      const url = AppProperties.get('datamart.url') as string
      console.log('Fetching...')
      try {
        const fullUrl = `${url}${now.getFullYear()}/${now.getFullYear()}-${now.getMonth() < 9 ? '0' : ''}${now.getMonth() + 1}-${now.getDate() < 10 ? '0' : ''}${now.getDate()}.csv`
        const fetchedCsv = await axios.get(fullUrl)
        console.log('Called: ' + fullUrl + ' result: ' + fetchedCsv.status)
        const csv = await fetchedCsv.data
        console.log(`Finished loading csv for ${now.toDateString()}`)
        const rows = csv.split(/\r?\n/)
        console.log(`CSV has ${rows.length} rows`)
        // grab from the second row so we ignore the headers
        for (let i = 1; i < rows.length; i++) {
          try {
            const row = (rows[i] as string).replace(/\"/g, '').replace(/\r?\n/, '')
            const cols: any[] = row.split(',')

            for (let i = 0; i < cols.length; i++) {
              cols[i] = cols[i] !== undefined && cols[i] !== null && cols[i] !== '' ? cols[i] : 'null'
            }

            const date = cols[1]
            const hour = date.slice(-2)
            const daily = hour === '12'
            const epoch = new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(hour), 0, 0, 0).getTime()

            let insert = `INSERT INTO wfwx.readings VALUES (${cols[0]}, ${epoch}, ${daily}, ${cols[3]}, ${cols[4]}, ${cols[5]}, ${cols[6]}, 0, ${cols[2]}, 0, ${cols[12]}, ${cols[8]}, ${cols[7]}, ${cols[10]}, ${cols[11]}, ${cols[9]}, ${cols[13]})`
            insert += ` ON CONFLICT (station_code, timestamp_epoch) DO UPDATE SET temperature = ${cols[3]},relative_humidity = ${cols[4]},wind_speed = ${cols[5]},wind_direction = ${cols[6]},precipitation = ${cols[2]},bui = ${cols[12]},isi = ${cols[8]},ffmc = ${cols[7]},dmc = ${cols[10]},dc = ${cols[11]},fwi = ${cols[9]},danger= ${cols[13]}`

            Database.query(insert).catch(err => {
              console.warn('Failed to insert row during datamart update')
            })
          } catch(err) {
            console.warn('Failed to insert row during datamart update')
            break;
          }
        }
      } catch (err) {
        console.error(err)
      }
      // check previous day
      now = new Date(now.getTime())
      now.setDate(now.getDate() - 1)

      daysChecked += 1
    }
    console.log('Completed datamart update')
  }, false)
]
