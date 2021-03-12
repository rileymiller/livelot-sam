import AWS, { DynamoDB } from 'aws-sdk'
import { v4 as uuid } from 'uuid'

import { SNSEvent, SNSHandler } from 'aws-lambda'


AWS.config.update({ region: process.env.AWS_REGION })

const s3 = new AWS.S3()

const dynamoClient = new AWS.DynamoDB();

// Main Lambda entry point
export const handler: SNSHandler = async (event: SNSEvent) => {
  return await imageUploaded(event)
}

const getS3ImageURL = (s3BucketName: string, imageid: string, imageExtension: string) => `https://${s3BucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageid}.${imageExtension}`


const getDynamoDBImageDTO = (imageMetadataPayload: ImageMetaDataPayload): DynamoDB.PutItemInput => ({
  TableName: process.env.DynamoTable ?? ``,
  ReturnConsumedCapacity: "TOTAL",
  Item: {
    "id": {
      S: uuid()
    },
    "camera_id": {
      S: imageMetadataPayload.camera_id
    },
    "creation_time": {
      S: imageMetadataPayload.creation_time
    },
    "file_name": {
      S: imageMetadataPayload.file_name
    },
    "time_stamp": {
      S: imageMetadataPayload.time_stamp
    },
    "s3_image_url": {
      S: imageMetadataPayload.s3_image_url
    },
    "classifications": {
      S: imageMetadataPayload.classifications
    },
    "imageid": {
      S: imageMetadataPayload.imageid
    },
    "content_type": {
      S: imageMetadataPayload.content_type
    },
    "requestid": {
      S: imageMetadataPayload.requestid
    },
    "ip_address": {
      S: imageMetadataPayload.ip_address
    },
    "image_width": {
      N: imageMetadataPayload.image_width
    },
    "image_height": {
      N: imageMetadataPayload.image_height
    }
  }
})

type ImageMetaDataPayload = {
  camera_id: string
  classifications: string
  content_type: string
  creation_time: string
  file_name: string
  image_height: string
  image_width: string
  imageid: string
  ip_address: string
  requestid: string
  s3_image_url: string
  time_stamp: string
}
const imageUploaded = async function (event: SNSEvent) {
  const SNSRecord = event.Records[0].Sns

  const SNSMessage = JSON.parse(SNSRecord.Message)

  console.log(SNSMessage.Records[0])

  const s3Bucket = SNSMessage.Records[0].s3
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

  const metadata = s3Object.Metadata

  const {
    camera_id,
    classifications,
    content_type,
    creation_time,
    file_name,
    image_height,
    image_width,
    imageid,
    ip_address,
    requestid,
    time_stamp,
  } = metadata

  const imageExtension = file_name.substr(file_name.indexOf('.') + 1)

  console.log(`imageExtension: ${imageExtension}`)

  console.log(`image_width: ${image_width}, image_height: ${image_height}`)

  const s3_image_url = getS3ImageURL(s3BucketName, imageid, imageExtension)

  const imageMetadataPayload: ImageMetaDataPayload = {
    camera_id,
    classifications,
    content_type,
    creation_time,
    file_name,
    image_height,
    image_width,
    imageid,
    ip_address,
    requestid,
    s3_image_url,
    time_stamp,
  }

  console.log(`imageMetadataPayload: ${JSON.stringify(imageMetadataPayload)}`)


  console.log(`DynamoTable: ${process.env.DynamoTable}`)

  const dynamoPutDTO = getDynamoDBImageDTO(imageMetadataPayload)

  console.log(`dynamoPutDTO: ${JSON.stringify(dynamoPutDTO)}`)

  try {

    console.log(`attempting PUT`)
    const dynamoResponse = await dynamoClient.putItem(dynamoPutDTO).promise()

    console.log(`dynamoResponse: ${JSON.stringify(dynamoResponse)}`)

  } catch (e) {
    console.log(`There was an error during the DynamoDB transaction: ${JSON.stringify(e)}`)
  }
}
