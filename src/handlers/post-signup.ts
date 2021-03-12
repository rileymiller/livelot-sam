import AWS, { DynamoDB } from 'aws-sdk'

import { PostConfirmationTriggerEvent, PostConfirmationTriggerHandler } from 'aws-lambda'

AWS.config.update({ region: process.env.AWS_REGION })
const dynamoClient = new AWS.DynamoDB();


// Main Lambda entry point
export const handler: PostConfirmationTriggerHandler = async (event) => {
  return await postSignup(event)
}

/**
 * Formats the User DynamoDB query where the user sub is the primary key.
 * 
 * @param createUserPayload payload for the usre create - PUT
 */
const getDynamoDBCreateUserDTO = (createUserPayload: UserPayloadType): DynamoDB.PutItemInput => ({
  TableName: process.env.DynamoTable ?? ``,
  ReturnConsumedCapacity: "TOTAL",
  Item: {
    "id": {
      S: createUserPayload.sub
    },
    "email_address": {
      S: createUserPayload.email
    },
    "name": {
      S: createUserPayload.name
    },
    "phone_number": {
      S: createUserPayload.phone_number
    },
    "address": {
      S: createUserPayload.address
    },
    "sms_enabled": {
      BOOL: true
    },
    "camera_ids": {
      SS: [""]
    }
  }
})

type UserPayloadType = {
  sub: string
  email: string
  name: string
  phone_number: string
  address: string
}

type LiveLotCognitoPostSignupEventUserAttributes = {
  sub: string
  [`cognito:user_status`]: string
  email_verified: string
  [`cognito:email_alias`]: string
  address: string
  phone_number_verified: string
  phone_number: string
  email: string
  name: string
}

const postSignup = async function (event: PostConfirmationTriggerEvent) {
  try {
    const userAttributes = event.request.userAttributes as LiveLotCognitoPostSignupEventUserAttributes

    const { sub, email, name, address, phone_number } = userAttributes

    console.log(`sub: ${sub}, email: ${email}, name: ${name}, address: ${address}, phone_number: ${phone_number}`)

    const createUserPayload: UserPayloadType = {
      sub,
      name,
      email,
      phone_number,
      address,
    }


    console.log(`createUserPayload: ${JSON.stringify(createUserPayload)}`)


    console.log(`DynamoTable: ${process.env.DynamoTable}`)

    const dynamoPutDTO = getDynamoDBCreateUserDTO(createUserPayload)

    console.log(`Create User DTO: ${JSON.stringify(dynamoPutDTO)}`)

    try {

      console.log(`Attempting PUT in ${process.env.DynamoTable} table`)

      const dynamoResponse = await dynamoClient.putItem(dynamoPutDTO).promise()

      console.log(`DynamoDB transaction response: ${JSON.stringify(dynamoResponse)}`)

      return event
    } catch (e) {
      console.log(`There was an error: ${JSON.stringify(e)}`)

      return event
    }
  } catch (e) {
    console.log(`There was an error durring post-signup: ${JSON.stringify(e)}`)

    return {
      response: e
    }
  }
}
