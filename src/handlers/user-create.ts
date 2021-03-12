import AWS, { DynamoDB } from 'aws-sdk'
import { v4 as uuid } from 'uuid'


import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import * as EmailValidator from 'email-validator'
import phone from 'phone'

AWS.config.update({ region: process.env.AWS_REGION })

const dynamoClient = new AWS.DynamoDB();


// Main Lambda entry point
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return await createUser(event)
}

type UserPayloadType = {
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

const getDynamoDBCreateUserDTO = (createUserPayload: UserPayloadType): DynamoDB.PutItemInput => ({
  TableName: process.env.DynamoTable ?? ``,
  ReturnConsumedCapacity: "TOTAL",
  Item: {
    "id": {
      S: uuid()
    },
    "name": {
      S: createUserPayload.name
    },
    "camera_id": {
      S: JSON.stringify(createUserPayload.cameraID)
    },
    "phone_number": {
      S: createUserPayload.phoneNumber
    },
    "email_address": {
      S: createUserPayload.emailAddress
    },
    "address": {
      S: createUserPayload.address
    }
  }
})

const createUser = async function (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log(`event.requestContext.requestId: ${event.requestContext.requestId}`)
  console.log(`event: ${JSON.stringify(event)}`)

  const requestID = event.requestContext.requestId
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
    name,
    cameraID,
    emailAddress,
    address,
    phoneNumber: formattedPhoneNumber[0]
  }


  console.log(`createUserPayload: ${JSON.stringify(createUserPayload)}`)


  console.log(`DynamoTable: ${process.env.DynamoTable}`)

  const dynamoPutDTO = getDynamoDBCreateUserDTO(createUserPayload)

  console.log(`Create User DTO: ${JSON.stringify(dynamoPutDTO)}`)

  try {

    console.log(`Attempting PUT in ${process.env.DynamoTable} table`)

    const dynamoResponse = await dynamoClient.putItem(dynamoPutDTO).promise()

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
        message: `Error creating DynamoDB record: ${JSON.stringify(e)}`
      })
    }
  }
}
