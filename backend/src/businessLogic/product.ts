import { ProductAccess } from '../dataLayer/productsAccess'

import { Product } from '../models/Product'
import { CreateProductRequest } from '../requests/CreateProductRequest'
import { UpdateProductRequest } from '../requests/UpdateProductRequest'
import { createLogger } from '../utils/logger'
import * as uuid from 'uuid'
//import * as createError from 'http-errors'
import { parseUserId } from '../auth/utils'

// TODO: Implement businessLogic

const productAccess = new ProductAccess()
const logger = createLogger('Todos')

export async function getProductsForUser(jwtToken: string): Promise<Product[]> {
  const userId = parseUserId(jwtToken)

  return productAccess.getProducts(userId)
}
export async function createProduct(
  jwtToken: string,
  CreateProductRequest: CreateProductRequest
) {
  const userId = parseUserId(jwtToken)
  const productId = uuid.v4()

  logger.info('userId', userId)
  logger.info('productId', productId)

  const item = {
    userId,
    productId,
    createdAt: new Date().toISOString(),
    sold: false,
    ...CreateProductRequest,
    attachmentUrl: ''
  }

  logger.info('Item to be created at business logic', item)
  const toReturn = productAccess.createProduct(item)

  return toReturn
}

export async function deleteProduct(jwtToken: string, productId: string) {
  const userId = parseUserId(jwtToken)
  const toReturn = productAccess.deleteProduct(userId, productId)

  return toReturn
}

export async function updateProduct(
  jwtToken: string,
  productId: string,
  UpdateProductRequest: UpdateProductRequest
) {
  const userId = parseUserId(jwtToken)
  const result = productAccess.updateProduct(
    UpdateProductRequest,
    productId,
    userId
  )

  return result
}

export async function createAttachmentPresignedUrl(
  jwtToken: string,
  productId: string
) {
  const userId = parseUserId(jwtToken)
  const result = productAccess.createAttachmentPresignedUrl(userId, productId)

  return result
}
