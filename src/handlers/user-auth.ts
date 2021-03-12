import AWS from 'aws-sdk'
import * as users from '../utils/user-management'
import * as admins from '../utils/admin-management'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as EmailValidator from 'email-validator'
import phone from 'phone'

AWS.config.update({ region: process.env.AWS_REGION })

export const SIGN_UP_ENDPOINT = `/signup`
export const SIGN_IN_ENDPOINT = `/signin`
export const ADMIN_SIGN_IN_ENDPOINT = `/admin/signin`

// Main Lambda entry point
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return await authorizeUser(event)
}


const getBadRequestResponse = (message: string): APIGatewayProxyResult => ({
  statusCode: 401,
  body: JSON.stringify({
    message: message
  })
})

const getNotFoundResponse = (): APIGatewayProxyResult => ({
  statusCode: 404,
  body: JSON.stringify({
    message: "Route not found."
  })
})

const signUp = async ({ email, name, phone_number, password, address }:
  { email: string, name: string, phone_number: string, password: string, address?: string }) => {
  try {
    await users.signUp(email, name, phone_number, password, address);

    console.log(`INFO: successful sign-up`)

    return createResponse({ message: "Created" }, 201);
  } catch (e) {
    console.log(e);
    return createResponse({ message: e.message }, 400);
  }
};

const signIn = async ({ email, password }: { email: string, password: string }) => {
  try {
    const token = await users.signIn(email, password);

    console.log(`INFO: successful sign-in`)

    return createResponse({ token }, 201);
  } catch (e) {
    console.log(`ERROR: signing in: ${e}`);
    return createResponse({ message: e.message }, 400);
  }
};

const adminSignIn = async ({ email, password }: { email: string, password: string }) => {
  try {
    const token = await admins.signIn(email, password);

    console.log(`INFO: successful sign-in`)

    return createResponse({ token }, 201);
  } catch (e) {
    console.log(`ERROR: signing in: ${e}`);
    return createResponse({ message: e.message }, 400);
  }
};

const createResponse: (data?: any, statusCode?: number) => any = (
  data = { message: "OK" },
  statusCode = 200
) => ({
  statusCode,
  body: JSON.stringify(data),
  headers: { "Access-Control-Allow-Origin": "*" }
});

type AuthType = {
  email: string
  name: string
  phone_number: string
  password: string
  address?: string
}
const authorizeUser = async function (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {

  const body: AuthType = JSON.parse(event.body || '{}')

  const { email, name, phone_number, password, address } = body

  console.log(JSON.stringify(event))

  if (!password) {
    return getBadRequestResponse(`No password specified`)
  }

  if (!email) {
    return getBadRequestResponse(`Email address was empty`)
  }


  if (!EmailValidator.validate(email)) {
    return getBadRequestResponse(`Invalid email address`)
  }



  if (event.path === SIGN_UP_ENDPOINT) {
    if (!name) {
      return getBadRequestResponse(`Name was empty`)
    }

    if (!phone_number) {
      return getBadRequestResponse(`Phone number was empty`)
    }

    const formattedPhoneNumber = phone(phone_number)

    if (formattedPhoneNumber.length === 0) {
      return getBadRequestResponse(`Invalid phone number`)
    }

    return signUp({ email, name, phone_number: formattedPhoneNumber[0], password, address });
  }
  else if (event.path === SIGN_IN_ENDPOINT) {
    return signIn({ email, password });
  }
  else if (event.path === ADMIN_SIGN_IN_ENDPOINT) {
    return adminSignIn({ email, password });
  }
  else {
    return getNotFoundResponse()
  }
}
