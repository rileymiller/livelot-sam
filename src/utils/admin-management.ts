import { CognitoUserPool, AuthenticationDetails, CognitoUser } from "amazon-cognito-identity-js"

const userPool = new CognitoUserPool({
  UserPoolId: process.env.ADMIN_POOL_ID ?? ``,
  ClientId: process.env.ADMIN_POOL_CLIENT_ID ?? ``
});

export const signIn = (email: string, password: string) =>
  new Promise((resolve, reject) => {

    console.log(`Authenticating Admin`)

    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password
    });

    const cognitoAdmin = new CognitoUser({
      Username: email,
      Pool: userPool
    });

    console.log(`cognitoAdmin: ${JSON.stringify(cognitoAdmin)}`)

    cognitoAdmin.authenticateUser(authenticationDetails, {
      onSuccess: result => {
        console.log(`Request success!!`)
        resolve(result.getIdToken().getJwtToken())
      },
      onFailure: err => {
        console.log(`Request failure!`)
        reject(err)
      },
      newPasswordRequired: function (userAttributes, requiredAttributes) {
        delete userAttributes.email_verified;

        delete userAttributes.phone_number_verified;

        // Get these details and call
        cognitoAdmin.completeNewPasswordChallenge(password, userAttributes, this);
      }
    });
  });