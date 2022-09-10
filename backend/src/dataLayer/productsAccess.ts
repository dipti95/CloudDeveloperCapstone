import * as AWS from 'aws-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { createLogger } from '../utils/logger'
import { Product } from '../models/Product'
import { ProductUpdate } from '../models/ProductUpdate'
const AWSXRay = require('aws-xray-sdk')

const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('TodosAccess')

// TODO: Implement the dataLayer logic
export class ProductAccess {
  constructor(
    private readonly docClient: DocumentClient = createDynamoDBClient(),
    private readonly s3Bucket = process.env.ATTACHMENT_S3_BUCKET,
    private readonly productsTable = process.env.PRODUCTS_TABLE,
    private readonly s3 = new XAWS.S3({ signatureVersion: 'v4' }),
    private readonly urlExpiration = process.env.SIGNED_URL_EXPIRATION
  ) {}

  async getProducts(userId): Promise<Product[]> {
    const result = await this.docClient
      .query({
        TableName: this.productsTable,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': userId
        }
      })
      .promise()

    logger.info('Result', result)

    const items = result.Items
    return items as Product[]
  }

  async createProduct(product: Product): Promise<Product> {
    await this.docClient
      .put({
        TableName: this.productsTable,
        Item: product
      })
      .promise()

    return product
  }

  async deleteProduct(userId: string, productId: string) {
    let result = {
      statusCode: 200,
      body: ''
    }

    let productToBeDeleted = await this.docClient
      .query({
        TableName: this.productsTable,
        KeyConditionExpression: 'userId = :userId AND productId = :productId',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':productId': productId
        }
      })
      .promise()

    if (productToBeDeleted.Items.length === 0) {
      result.statusCode = 404
      result.body = 'Item not found'
      return result
    }

    await this.docClient
      .delete({
        TableName: this.productsTable,
        Key: {
          userId,
          productId
        }
      })
      .promise()

    await this.s3
      .deleteObject({
        Bucket: this.s3Bucket,
        Key: productId
      })
      .promise()

    return result
  }

  async updateProduct(
    productUpdate: ProductUpdate,
    productId: string,
    userId: string
  ): Promise<ProductUpdate> {
    console.log(`Updating product with id ${productId}`)

    const params = {
      TableName: this.productsTable,
      Key: {
        userId: userId,
        productId: productId
      },

      UpdateExpression: 'set #a = :a, #b = :b, #c = :c, #d = :d',
      ExpressionAttributeNames: {
        '#a': 'name',
        '#b': 'category',
        '#c': 'bestBefore',
        '#d': 'sold'
      },
      ExpressionAttributeValues: {
        ':a': productUpdate['name'],
        ':b': productUpdate['category'],
        ':c': productUpdate['bestBefore'],
        ':d': productUpdate['sold']
      },
      ReturnValues: 'ALL_NEW'
    }

    const result = await this.docClient.update(params).promise()

    logger.info('Result is', result)

    console.log(`Result is ${result}`)
    const attributes = result.Attributes

    return attributes as ProductUpdate
  }

  async createAttachmentPresignedUrl(userId, productId) {
    let result = {
      statusCode: 201,
      body: ''
    }

    let checkIfExist = await this.docClient
      .query({
        TableName: this.productsTable,
        KeyConditionExpression: 'userId = :userId AND productId = :productId',
        ExpressionAttributeValues: {
          ':userId': userId,
          ':productId': productId
        }
      })
      .promise()

    logger.info('IsExist', checkIfExist)

    if (checkIfExist.Items.length === 0) {
      result = {
        statusCode: 404,
        body: 'Item not found'
      }
      return result
    }

    await this.docClient
      .update({
        TableName: this.productsTable,
        Key: {
          userId,
          productId
        },
        UpdateExpression: 'set #attachmentUrl =:attachmentUrl',
        ExpressionAttributeValues: {
          ':attachmentUrl': `https://${this.s3Bucket}.s3.amazonaws.com/${productId}`
        },
        ExpressionAttributeNames: { '#attachmentUrl': 'attachmentUrl' },
        ReturnValues: 'UPDATED_NEW'
      })
      .promise()

    result.body = this.s3.getSignedUrl('putObject', {
      Bucket: this.s3Bucket,
      Key: productId,
      Expires: parseInt(this.urlExpiration)
    })

    return result
  }
}

function createDynamoDBClient() {
  if (process.env.IS_OFFLINE) {
    console.log('Creating a local DynamoDB instance')
    return new XAWS.DynamoDB.DocumentClient({
      region: 'localhost',
      endpoint: 'http://localhost:8000'
    })
  }

  return new XAWS.DynamoDB.DocumentClient()
}
