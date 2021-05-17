import { constructAPIGwEvent } from "../../utils/helpers";

import { handler } from '../../../src/handlers/get-signed-url'

import { S3, DynamoDB } from 'aws-sdk'
import { SNSEvent } from 'aws-lambda'

import { genericRequestContext, validUploadBodyMock, missingFilenameMock, missingFileExtensionMock, invalidFileExtensionMock } from '../../fixtures/imageUploadRequest'

describe('get-signed-url', () => {
  let S3Spy
  beforeEach(() => {
    // mock s3 head response
    S3Spy = jest.spyOn(S3.prototype, 'headObject')

    // mock the dynamodb put
  });


  it('adds metadata to dynamod db image metadata table', async () => {
    // Arrange
    const uploadURL = `https://livelot-upload-bucket-056969206585.s3.us-east-2.amazonaws.com/a66b4cd1-7e36-41aa-99df-abebd2dfef39.png?Content-Type=image%2Fpng&X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=ASIAQ2Q5BDM43M3UM2MV%2F20210312%2Fus-east-2%2Fs3%2Faws4_request&X-Amz-Date=20210312T060336Z&X-Amz-Expires=300&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEHYaCXVzLWVhc3QtMiJIMEYCIQD2feKfNGTPcHOQVRtQfuGvWbe0Kcd%2BUWEKC30fyO3W0gIhAPcAeG4MEEE5G398wyy%2FGrmIU1q9oOP551rx6kFo7Q%2BSKt8BCJ%2F%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEQARoMMDU2OTY5MjA2NTg1IgzJPZi2rfXfxcuvgQ4qswF%2BXpgtQJRvM88NYkjHEzOxDWMVhZq4o3OLe9E%2BLSS6L6VM5UR%2BykAiB1Z6hXfCho8M9HT62EpKidrrVKoM7IyLBoeVj6o0dko4mfkF3j7GJyM03FKd0Vn790L%2FUKoOb5R61pmla4F2KyEhwr0liYjCy82pakYCucrTZ6fVIbONi74HvXj7NeXDwKEUDX%2B%2BqYv9YC3Iu9UxHGvaXCFBk4%2FWq%2FYSc7PXr6ajH4A0HdHrUFTD6jCVhqyCBjrfAaYrL5I0M8yNRXFfOHQkhjVl156IPUohn46cE26yEvj7GJLtmIDpwySAR%2FtIRtCuPdDgpqM1JYhze6pZUh%2Bl4GvMQ%2FAVJI%2Ft%2BnWAo%2BsbfaBukvEcYWCUwQgecVmgwfMQ1Ff4yNvHGqNB4mlLGUXnb665cIIBGABxN8x74T0bkBdd7IpJUHFnZvFtFM8OXJH31XJFoIM0RKm34w5FDyf2ZnEH2ibJzXlrFTK5DXuB%2F3X3%2FI%2F3yH7is9iXTs4oT7XJ3kmfPdxqor9707KDZtJUobce9hjaAdAGWVoWHHJxxOU%3D&X-Amz-Signature=b792b0a528235c6d4df69cb1c22571ce72986fd4cff7a7e0860cb82d22f09a8d&X-Amz-SignedHeaders=host%3Bx-amz-acl%3Bx-amz-meta-camera_id%3Bx-amz-meta-classifications%3Bx-amz-meta-content_type%3Bx-amz-meta-creation_time%3Bx-amz-meta-file_name%3Bx-amz-meta-image_height%3Bx-amz-meta-image_width%3Bx-amz-meta-imageid%3Bx-amz-meta-ip_address%3Bx-amz-meta-requestid%3Bx-amz-meta-time_stamp&x-amz-acl=public-read&x-amz-meta-camera_id=4567&x-amz-meta-classifications=%7B%22box%22%3A0.12%7D&x-amz-meta-content_type=image%2Fpng&x-amz-meta-creation_time=09823&x-amz-meta-file_name=test.png&x-amz-meta-image_height=430&x-amz-meta-image_width=560&x-amz-meta-imageid=a66b4cd1-7e36-41aa-99df-abebd2dfef39&x-amz-meta-ip_address=192.0.3.112&x-amz-meta-requestid=cD2Y4ijPiYcEM5w%3D&x-amz-meta-time_stamp=212122`
    S3Spy.mockReturnValue(uploadURL);

    const event = constructAPIGwEvent({}, {
      method: 'POST',
      requestContext: genericRequestContext,
      body: JSON.stringify(validUploadBodyMock)
    });

    // Act
    const result = await handler(event);

    // Assert
    expect(S3Spy).toHaveBeenCalledTimes(1)
    expect(result).toEqual({
      statusCode: 200,
      body: expect.any(String)
    })

    const parsedResultBody = JSON.parse(result.body)
    expect(parsedResultBody).toEqual({
      Key: expect.any(String),
      uploadURL: uploadURL
    })
  });
});