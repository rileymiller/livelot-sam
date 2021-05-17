# camera-cloud

Cloud Formation stack for managing uploads from RPI fields nodes.

Images are uploaded to S3 which kicks off several lambdas which will record metadata from the imageupload to a dynamodb table and shoot a text message to camera subscribers using Twilio.

We also have a half-baked API to manage users and secure the upload stack's API using Cognito.
