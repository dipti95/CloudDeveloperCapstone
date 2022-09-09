// export interface TodoItem {
//   userId: string
//   todoId: string
//   createdAt: string
//   name: string
//   dueDate: string
//   done: boolean
//   attachmentUrl?: string
// }

export interface Product {
  userId: string
  productId: string
  createdAt: string
  name: string
  category: string
  bestBefore: string
  sold: boolean
  attachmentUrl?: string
}
