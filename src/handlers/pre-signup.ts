import AWS from 'aws-sdk'

import { PreSignUpTriggerEvent, PreSignUpTriggerHandler } from 'aws-lambda'

AWS.config.update({ region: process.env.AWS_REGION })

// Main Lambda entry point
export const handler: PreSignUpTriggerHandler = async (event) => {
  return await preSignup(event)
}

const preSignup = async function (event: PreSignUpTriggerEvent) {
  try {
    event.response = {
      ...event.response,
      autoConfirmUser: true,
      autoVerifyEmail: true,
      autoVerifyPhone: true
    }

    console.log(`Pre-signup auto-verification: ${JSON.stringify(event)}`)
    return event
  } catch (e) {
    console.log(`There was an error durring pre-signup: ${JSON.stringify(e)}`)
    return {
      response: e
    }
  }
}
