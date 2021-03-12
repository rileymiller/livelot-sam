import AWS from 'aws-sdk'
import mime from 'mime-types'
import { v4 as uuid } from 'uuid'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

AWS.config.update({ region: process.env.AWS_REGION })
const s3 = new AWS.S3()

// Change this value to adjust the signed URL's expiration
const URL_EXPIRATION_SECONDS = 300

// Main Lambda entry point
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return await getUploadURL(event)
}

const getFileExtension = (filename: string) => {
  if (!filename) {
    throw new Error(`No file name specified`)
  }

  if (-1 === filename.indexOf('.')) {
    throw new Error(`File Extension not specified`)
  }

  return filename.substr(filename.indexOf('.'))
}

/**
 * The Image Meta data payload that is signed by the aws-sdk library
 */
type ImageMetaDataPayload = {
  camera_id: string
  classifications: string
  content_type: string
  creation_time: string
  file_name: string
  image_height: string
  image_width: string
  ip_address: string
  time_stamp: string
}

/**
 * The expected request structure of an image upload request object
 */
type ImageUploadRequestBody = {
  cameraID: string
  classifications: string
  creationTime: string
  fileName: string
  imageHeight: string
  imageWidth: string
  ipAddress: string
  timeStamp: string
}

const getUploadURL = async function (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log(`event.requestContext.requestId: ${event.requestContext.requestId}`)
  console.log(`event: ${JSON.stringify(event)}`)

  const requestID = event.requestContext.requestId
  const body: ImageUploadRequestBody = JSON.parse(event.body || '{}')

  let imageMimeType
  let imageExtension
  try {

    imageExtension = getFileExtension(body.fileName)

    console.log(`Image Extension: ${imageExtension}`)

    imageMimeType = mime.lookup(imageExtension)

    console.log(`Image Mime Type: ${imageMimeType}`)

    if (!imageMimeType) {
      throw new Error('Invalid file extension')
    }
  } catch (e) {
    console.log(`err: ${e}`)
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `${e}` })
    }
  }

  const imageMetadata: ImageMetaDataPayload = {
    camera_id: body.cameraID,
    classifications: JSON.stringify(body.classifications),
    content_type: imageMimeType,
    creation_time: body.creationTime,
    file_name: body.fileName,
    image_height: JSON.stringify(body.imageHeight),
    image_width: JSON.stringify(body.imageWidth),
    ip_address: body.ipAddress,
    time_stamp: body.timeStamp,
  }

  const imageID = uuid()

  const Key = `${imageID}${imageExtension}`

  // Get signed URL from S3
  const s3Params = {
    Bucket: process.env.UploadBucket,
    Key,
    Expires: URL_EXPIRATION_SECONDS,
    ContentType: imageMimeType,
    Metadata: {
      ...imageMetadata,
      imageID,
      requestID,
    },

    // This ACL makes the uploaded object publicly readable. You must also uncomment
    // the extra permission for the Lambda function in the SAM template.
    ACL: 'public-read'
  }

  console.log('Params: ', s3Params)

  let uploadURL
  try {
    uploadURL = await s3.getSignedUrlPromise(`putObject`, s3Params)
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `${e}` })
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      uploadURL: uploadURL,
      Key
    })
  }
}
