import AWS, { DynamoDB } from 'aws-sdk'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'


AWS.config.update({ region: process.env.AWS_REGION })

const dynamoClient = new AWS.DynamoDB();


// Main Lambda entry point
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return await getAllUsers(event)
}

const getScanUserTableDTO = (): DynamoDB.ScanInput => ({
  TableName: process.env.DynamoTable ?? ``,
})

const getAllUsers = async function (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log(`event.requestContext.requestId: ${event.requestContext.requestId}`)
  console.log(`event: ${JSON.stringify(event)}`)

  const requestID = event.requestContext.requestId

  try {

    console.log(`Attempting scan for ${process.env.DynamoTable} table`)
    const scanDynamoDTO = getScanUserTableDTO()
    const dynamoResponse = await dynamoClient.scan(scanDynamoDTO).promise()

    console.log(`DynamoDB transaction response: ${JSON.stringify(dynamoResponse)}`)

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: dynamoResponse
      })
    }
  } catch (e) {
    console.log(`There was an error: ${JSON.stringify(e)}`)
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Error scanning DynamoDB: ${JSON.stringify(e)}`
      })
    }
  }
}
