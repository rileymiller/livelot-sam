import { APIGatewayProxyEvent, SQSEvent } from "aws-lambda";

const DEFAULT_OPTIONS = {
  method: "GET", headers: {}, query: {}, path: "/"
}

export function constructAPIGwEvent(message: any, options: any = DEFAULT_OPTIONS): APIGatewayProxyEvent {
  const opts = {
    DEFAULT_OPTIONS,
    ...options
  }

  return {
    httpMethod: opts.method,
    path: opts.path,
    queryStringParameters: opts.query,
    headers: opts.headers,
    body: opts.body || JSON.stringify(message),
    multiValueHeaders: {},
    multiValueQueryStringParameters: {},
    isBase64Encoded: false,
    pathParameters: opts.pathParameters || {},
    stageVariables: {},
    requestContext: opts.requestContext || {},
    resource: null,
  }
}