import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { deleteProduct } from '../../businessLogic/product'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const productId = event.pathParameters.productId
    // TODO: Remove a TODO item by id
    console.log('Processing Event ', event)
    const authorization = event.headers.Authorization
    const split = authorization.split(' ')
    const jwtToken = split[1]

    const deleteItem = await deleteProduct(jwtToken, productId)

    return {
      statusCode: 200,
      body: deleteItem.body
    }
  }
)

handler.use(httpErrorHandler()).use(
  cors({
    credentials: true
  })
)
