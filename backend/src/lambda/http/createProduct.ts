import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { CreateProductRequest } from '../../requests/CreateProductRequest'
// import { getUserId } from '../utils'
import { createProduct } from '../../businessLogic/product'

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const newProduct: CreateProductRequest = JSON.parse(event.body)
    // TODO: Implement creating a new TODO item
    console.log('Processing Event ', event)
    const authorization = event.headers.Authorization
    const split = authorization.split(' ')
    const jwtToken = split[1]

    const productItem = await createProduct(jwtToken, newProduct)

    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        item: productItem
      })
    }
  }
)

handler.use(
  cors({
    credentials: true
  })
)
