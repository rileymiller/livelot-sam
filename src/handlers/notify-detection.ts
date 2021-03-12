import AWS, { DynamoDB } from 'aws-sdk'

import { SNSEvent, SNSHandler } from 'aws-lambda'

import Twilio from 'twilio'
AWS.config.update({ region: process.env.AWS_REGION })

const s3 = new AWS.S3()
const dynamoClient = new AWS.DynamoDB();

// Main Lambda entry point
export const handler: SNSHandler = async (event: SNSEvent) => {
  return await notifyDetection(event)
}

const getS3ImageURL = (s3BucketName: string, imageid: string, imageExtension: string) => `https://${s3BucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageid}.${imageExtension}`


// const createGetCameraIDDTO = (cameraID: string): DynamoDB.QueryInput => ({
//   TableName: process.env.DynamoTable ?? ``,
//   KeyConditionExpression: `id =  :id`,
//   ExpressionAttributeValues: {
//     [':id']: { "S": cameraID }
//   }
// })

const createGetUserFromCameraIDDTO = (cameraID: string): DynamoDB.ScanInput => ({
  TableName: process.env.DynamoTable ?? ``,
  FilterExpression: `contains(#camera_ids,:id)`,
  ExpressionAttributeNames: {
    '#camera_ids': "camera_ids"
  },
  ExpressionAttributeValues: {
    [':id']: { "S": cameraID }
  }
})

type UserTableRecord = {
  camera_ids: string[]
  phone_number: string
  address: string
  id: string
  name: string
  sms_enabled: boolean
  email_address: string
}

const sendMessageViaTwilio = async (phone_number: string, s3URL: string) => {
  // Send a text message

  const accountSid = `AC5fdff3b5352a5c28141033dbe87274a9`

  const authToken = `a268a9882aeea764e2e51dbb4e8258fb`

  const twilioNumber = `+15855677108`
  const client = Twilio(accountSid, authToken)

  try {
    console.log(`Preparing to send message through twilio`)

    console.log(`Sending message to ${phone_number}`)

    const message = await client.messages.create({
      body: `Vehicle detected: ${s3URL}`,
      to: phone_number,  // your phone number
      from: twilioNumber // a valid Twilio number
    })

    console.log(`publish response: ${JSON.stringify(message)}`)
  } catch (e) {
    console.log(`Error publishing SMS ${JSON.stringify(e)}`)
  }
}
const notifyDetection = async function (event: SNSEvent) {
  console.log(`notifyDetection event: ${JSON.stringify(event)}`)

  const SNSRecord = event.Records[0].Sns

  const SNSMessage = JSON.parse(SNSRecord.Message)

  console.log(SNSMessage.Records[0])

  const s3Bucket = SNSMessage.Records[0].s3
  console.log(JSON.stringify(s3Bucket))
  const { name } = s3Bucket.bucket
  const { key } = s3Bucket.object

  const s3BucketName = name
  // First fetch metadata from S3
  const s3Object = await s3.headObject({ Bucket: name, Key: key }).promise();

  if (!s3Object.Metadata) {
    // Shouldn't get here
    const errorMessage = 'Cannot process photo as no metadata is set for it';
    console.error(errorMessage, { s3Object, event });
    throw new Error(errorMessage);
  }

  console.log(`s3Object: ${JSON.stringify(s3Object)}`)

  const { imageid, file_name, camera_id } = s3Object.Metadata

  const imageExtension = file_name.substr(file_name.indexOf('.') + 1)

  const imageURL = getS3ImageURL(s3BucketName, imageid, imageExtension)

  console.log(`imageURL: ${imageURL}`)


  // Get the uploaded camera's user info
  if (!camera_id) {
    throw new Error(`Camera ID not specified`)
  }

  try {
    const getUserDTO = createGetUserFromCameraIDDTO(camera_id)

    console.log(`getUserDTO: ${JSON.stringify(getUserDTO)}`)

    const dynamoResponse = await dynamoClient.scan(getUserDTO).promise()

    console.log(`dynamoResponse: ${JSON.stringify(dynamoResponse)}`)

    const firstResponse = dynamoResponse.Items ? dynamoResponse.Items[0] : null

    if (!firstResponse) {
      throw new Error(`No items returned with corresponding camera_id`)
    }

    const unmarshalledResponse = DynamoDB.Converter.unmarshall(firstResponse) as UserTableRecord

    console.log(`unmarshalledResponse: ${JSON.stringify(unmarshalledResponse)}`)

    const { phone_number, sms_enabled, id } = unmarshalledResponse

    if (!sms_enabled) {
      throw new Error(`SMS is not enabled for user: ${id}`)
    }

    if (!phone_number) {
      throw new Error(`No phone number attached to user`)
    }

    await sendMessageViaTwilio(phone_number, imageURL)
  } catch (e) {
    console.log(`There was an error finding a user with the camera_id: ${JSON.stringify(e)}`)
  }
}
