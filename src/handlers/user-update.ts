import AWS, { DynamoDB } from 'aws-sdk'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import * as EmailValidator from 'email-validator'
import phone from 'phone'

AWS.config.update({ region: process.env.AWS_REGION })

const dynamoClient = new AWS.DynamoDB();


// Main Lambda entry point
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return await updateUser(event)
}

type UserPayloadType = {
  id: string
  name: string
  cameraID: string[]
  phoneNumber: string
  emailAddress: string
  address: string
}

const getBadRequestResponse = (message: string): APIGatewayProxyResult => ({
  statusCode: 401,
  body: JSON.stringify({
    message: message
  })
})

const getUpdateUserDTO = (user: UserPayloadType): DynamoDB.UpdateItemInput => ({
  TableName: process.env.DynamoTable ?? ``,
  Key: {
    [`id`]: { "S": user.id },
  },
  UpdateExpression: `SET #n = :n,  camera_id = :c,  phone_number = :p, email_address = :e, address = :a`,
  ExpressionAttributeNames: {
    '#n': "name"
  },
  ExpressionAttributeValues: {
    [`:n`]: { "S": user.name },
    [`:c`]: { "S": JSON.stringify(user.cameraID) },
    [`:p`]: { "S": user.phoneNumber },
    [`:e`]: { "S": user.emailAddress },
    [`:a`]: { "S": user.address }
  },
  ReturnValues: `ALL_NEW`
})

const updateUser = async function (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log(`event.requestContext.requestId: ${event.requestContext.requestId}`)
  console.log(`event: ${JSON.stringify(event)}`)
  const id = event.pathParameters?.id

  console.log(`URLParams: ${event.pathParameters}`)

  if (!id) {
    return getBadRequestResponse(`User ID was not specified`)
  }

  const body: UserPayloadType = JSON.parse(event.body || '{}')

  console.log(`Request Body: ${JSON.stringify(body)}`)

  const { name, cameraID, emailAddress, address, phoneNumber } = body


  if (!name) {
    return getBadRequestResponse(`User's name was empty`)
  }

  if (!cameraID) {
    return getBadRequestResponse(`Camera ID was empty`)
  }

  if (cameraID.length < 1) {
    return getBadRequestResponse(`Array of camera ID's was empty`)
  }

  if (!emailAddress) {
    return getBadRequestResponse(`Email address was empty`)
  }

  if (!EmailValidator.validate(emailAddress)) {
    return getBadRequestResponse(`Invalid email address`)
  }

  if (!address) {
    return getBadRequestResponse(`Address was empty`)
  }

  if (!phoneNumber) {
    return getBadRequestResponse(`Phone number was empty`)
  }

  const formattedPhoneNumber = phone(phoneNumber)

  if (formattedPhoneNumber.length === 0) {
    return getBadRequestResponse(`Invalid phone number`)
  }


  const createUserPayload: UserPayloadType = {
    id,
    name,
    cameraID,
    emailAddress,
    address,
    phoneNumber: formattedPhoneNumber[0]
  }
  try {

    console.log(`Attempting scan for ${process.env.DynamoTable} table`)

    const updateUserDTO = getUpdateUserDTO(createUserPayload)
    const dynamoResponse = await dynamoClient.updateItem(updateUserDTO).promise()

    console.log(`DynamoDB transaction response: ${JSON.stringify(dynamoResponse)}`)

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: dynamoResponse
      })
    }
  } catch (e) {
    console.log(`There was an error: ${JSON.stringify(e)}`)
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: `Error updating DynamoDB item: ${JSON.stringify(e)}`
      })
    }
  }
}
