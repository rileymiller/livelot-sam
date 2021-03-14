import { ImageUploadRequestBody } from '../../src/handlers/get-signed-url'

export const classificationMock = {
  person: {
    score: 0.345,
    bounding_box: [0.11, 0.33, 0.89, 0.55]
  }
}

export const genericRequestContext = {
  requestId: `testID`,
  accountId: `eafsdf`,
}

export const validUploadBodyMock: ImageUploadRequestBody = {
  cameraID: `abc`,
  classifications: JSON.stringify(classificationMock),
  creationTime: `03/13/2021, 02:11:52`,
  fileName: `de682c9c-8873-4a0f-b8c6-c39a39fe0ad8.jpg`,
  imageHeight: 720,
  imageWidth: 1280,
  ipAddress: `172.18.0.2`,
  timeStamp: `615601512.185818`
}

export const missingFilenameMock: Omit<ImageUploadRequestBody, 'fileName'> = {
  cameraID: `abc`,
  classifications: JSON.stringify(classificationMock),
  creationTime: `03/13/2021, 02:11:52`,
  imageHeight: 720,
  imageWidth: 1280,
  ipAddress: `172.18.0.2`,
  timeStamp: `615601512.185818`
}

export const missingFileExtensionMock: ImageUploadRequestBody = {
  cameraID: `abc`,
  classifications: JSON.stringify(classificationMock),
  creationTime: `03/13/2021, 02:11:52`,
  fileName: `de682c9c-8873-4a0f-b8c6-c39a39fe0ad8`,
  imageHeight: 720,
  imageWidth: 1280,
  ipAddress: `172.18.0.2`,
  timeStamp: `615601512.185818`
}

export const invalidFileExtensionMock: ImageUploadRequestBody = {
  cameraID: `abc`,
  classifications: JSON.stringify(classificationMock),
  creationTime: `03/13/2021, 02:11:52`,
  fileName: `de682c9c-8873-4a0f-b8c6-c39a39fe0ad8.ndxf`,
  imageHeight: 720,
  imageWidth: 1280,
  ipAddress: `172.18.0.2`,
  timeStamp: `615601512.185818`
}