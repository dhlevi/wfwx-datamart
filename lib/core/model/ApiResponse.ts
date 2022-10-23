export class ApiResponse {
  responseBody?: any
  status: number

  constructor (status: number, responseBody: any | undefined = undefined) {
    this.responseBody = responseBody
    this.status = status
  }
}
