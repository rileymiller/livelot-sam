import AWS, { DynamoDB } from 'aws-sdk'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'


AWS.config.update({ region: process.env.AWS_REGION })

const dynamoClient = new AWS.DynamoDB();


// Main Lambda entry point
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return await deleteUesr(event)
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

const getDeleteUserDTO = (user: UserPayloadType): DynamoDB.DeleteItemInput => ({
  TableName: process.env.DynamoTable ?? ``,
  Key: {
    [`id`]: { "S": user.id },
  },
})

const deleteUesr = async function (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log(`event.requestContext.requestId: ${event.requestContext.requestId}`)
  console.log(`event: ${JSON.stringify(event)}`)

  const id = event.pathParameters?.id

  console.log(`URLParams: ${event.pathParameters}`)

  console.log(`id: ${id}`)

  const body: UserPayloadType = JSON.parse(event.body || '{}')

  console.log(`Request Body: ${JSON.stringify(body)}`)

  if (!id) {
    return getBadRequestResponse(`User ID was not specified`)
  }

  try {

    console.log(`Attempting delete for ${id} in ${process.env.DynamoTable} table`)

    const deleteUserDTO = getDeleteUserDTO({ id })

    console.log(`deleteUserDTO: ${JSON.stringify(deleteUserDTO)}`)

    const dynamoResponse = await dynamoClient.deleteItem(deleteUserDTO).promise()

    console.log(`DynamoDB transaction response: ${JSON.stringify(dynamoResponse)}`)

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: `User ${id} was successfully deleted`
      })
    }
  } catch (e) {
    console.log(`There was an error: ${JSON.stringify(e)}`)
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Error deleteing DynamoDB item: ${JSON.stringify(e)}`
      })
    }
  }
}
