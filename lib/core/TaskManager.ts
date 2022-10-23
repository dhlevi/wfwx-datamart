import { scheduledTasks } from "../scheduled-tasks/TaskLoader"
import { Task } from "./model/Task"
import * as cron from 'node-cron'

export class TaskManager {
  private static _instance: TaskManager
  private _initialized = false
  private _tasks: Task[] = []
  // Singleton pattern requires a private constructor to prevent instantiation
  private constructor () { /* empty */ }

  private static instance (): TaskManager {
    if (!TaskManager._instance) {
      TaskManager._instance = new TaskManager()
    }

    if (!TaskManager._instance._initialized) {
      console.warn('TaskManager currently uninitialized')
    }

    return TaskManager._instance
  }

  public static clearTasks (): boolean {
    let result = false
    for (const task of TaskManager.instance()._tasks) {
      result = TaskManager.stopTask(task.name)

      if (!result) {
        throw new Error(`Task Manager failed to stop task ${task.name}`)
      }
    }
    TaskManager.instance()._tasks = []
    return result
  }

  public static addTask (task: Task) {
    const existingTask = TaskManager.instance()._tasks.find(t => t.name.toLowerCase().trim() === task.name.toLowerCase().trim())
    if (!existingTask) {
      TaskManager.instance()._tasks.push(task)
      if (task.cron) {
        task.intervalReference = cron.schedule(task.cron, task.callback, task.cronOptions)
      } else if (task.interval) {
        console.log(`Creating Scheduled task ${task.name}, running ${task.loop ? 'every' : 'once in'} ${task.interval / 1000} seconds`)
        if (task.loop) {
        task.intervalReference = setInterval(task.callback, task.interval)
        } else {
          task.intervalReference = setTimeout(task.callback, task.interval)
        }
      } else {
        throw new Error('Task creation attempted with no cron or interval!')
      }
    } else {
      console.warn(`Duplicate task ${task.name} detected. Ignoring duplicate task.`)
    }
  }

  public static restartTasks (): boolean {
    let result = false
    for (const task of TaskManager.instance()._tasks) {
      result = TaskManager.restartTask(task.name)
      if (!result) {
        throw new Error(`Task Manager failed to restart task ${task.name}`)
      }
    }
    return result
  }

  public static stopTask (name: string): boolean {
    console.warn('Stopping task ' + name)
    const task = TaskManager.instance()._tasks.find(t => t.name.toLowerCase().trim() === name.toLowerCase().trim())
    if (task) {
      if (task.interval) {
        clearInterval(task.intervalReference)
        task.intervalReference = null
      } else {
        (task.intervalReference as cron.ScheduledTask).stop()
      }
      return true
    }
    return false
  }

  public static restartTask (name: string): boolean {
    console.warn('Restarting task ' + name)
    if (TaskManager.stopTask(name)) {
      const task = TaskManager.instance()._tasks.find(t => t.name.toLowerCase().trim() === name.toLowerCase().trim())
      if (task) {
        console.warn('Starting task ' + name)
        if (task.interval) {
          if (task.loop) {
            task.intervalReference = setInterval(task.callback, task.interval)
          } else {
            task.intervalReference = setTimeout(task.callback, task.interval)
          }
        } else {
          (task.intervalReference as cron.ScheduledTask).start()
        }
        return true
      }
    }
    return false
  }

  public static initialized (): boolean {
    return TaskManager.instance()._initialized
  }

  public static async initialize (): Promise<void> {
    return TaskManager.instance().initialize()
  }

  // initialize with provided tasks, or, use the default loader
  private async initialize (tasks: Task[] = scheduledTasks): Promise<void> {
    console.warn('Initializing Task Manager')
    this._tasks = []
    for (const task of tasks) {
      TaskManager.addTask(task)
    }

    this._initialized = true
    console.warn('Task Manager Initialized')
  }
}
