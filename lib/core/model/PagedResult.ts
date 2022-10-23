export class PagedResult {
  public page: number
  public rows: number
  public totalPages: number
  public collection: any[]

  constructor(page: number, rows: number, totalPages: number, collection: any[]) {
    this.page = page
    this.rows = rows
    this.totalPages = totalPages
    this.collection = collection
  }
}