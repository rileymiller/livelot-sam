import AWS, { DynamoDB } from 'aws-sdk'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'


AWS.config.update({ region: process.env.AWS_REGION })

const dynamoClient = new AWS.DynamoDB();


// Main Lambda entry point
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return await getUser(event)
}

type UserPayloadType = {
  id: string
}

const getBadRequestResponse = (message: string): APIGatewayProxyResult => ({
  statusCode: 401,
  body: JSON.stringify({
    message: message
  })
})

const createGetUserDTO = (user: UserPayloadType): DynamoDB.QueryInput => ({
  TableName: process.env.DynamoTable ?? ``,
  KeyConditionExpression: `id =  :id`,
  ExpressionAttributeValues: {
    [':id']: { "S": user.id }
  }
})

const getUser = async function (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log(`event.requestContext: ${JSON.stringify(event.requestContext)}`)

  const id = event.pathParameters?.id

  console.log(`URLParams: ${event.pathParameters}`)

  console.log(`id: ${id}`)

  const body: UserPayloadType = JSON.parse(event.body || '{}')

  console.log(`Request Body: ${JSON.stringify(body)}`)

  if (!id) {
    return getBadRequestResponse(`User ID was not specified`)
  }

  try {

    console.log(`Attempting query for ${process.env.DynamoTable} table`)

    const getUserDTO = createGetUserDTO({ id })

    console.log(`getUserDTO: ${JSON.stringify(getUserDTO)}`)

    const dynamoResponse = await dynamoClient.query(getUserDTO).promise()

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
        message: `Error querying DynamoDB: ${JSON.stringify(e)}`
      })
    }
  }
}
