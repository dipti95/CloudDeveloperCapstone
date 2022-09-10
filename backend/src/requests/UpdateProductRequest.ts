/**
 * Fields in a request to update a single TODO item.
 */
// export interface UpdateTodoRequest {
//   name: string
//   dueDate: string
//   done: boolean
// }

export interface UpdateProductRequest {
  name: string
  category: string
  bestBefore: string
  sold: boolean
}
