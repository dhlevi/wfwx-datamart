import * as cron from 'node-cron'

export class Task {
  readonly name: string
  readonly interval?: number
  readonly cron?: string
  readonly callback: () => void
  readonly loop?: boolean = true
  readonly cronOptions: cron.ScheduleOptions | undefined
  public intervalReference?: any

  constructor (name: string, schedule: number | string, callback: () => void, loop = true, cronOptions: cron.ScheduleOptions | undefined = undefined) {
    this.name = name
    this.callback = callback
    this.loop = loop
    this.intervalReference = null
    this.interval = (typeof schedule === 'string') ? undefined : Number(schedule)
    this.cron = (typeof schedule !== 'string') ? undefined : schedule
    this.cronOptions = cronOptions
  }
}
