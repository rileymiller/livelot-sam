import { CognitoUserPool, CognitoUserAttribute, AuthenticationDetails, CognitoUser } from "amazon-cognito-identity-js"

const userPool = new CognitoUserPool({
  UserPoolId: process.env.USER_POOL_ID ?? ``,
  ClientId: process.env.USER_POOL_CLIENT_ID ?? ``
});

console.log(`process.env.USER_POOL_ID: ${process.env.USER_POOL_ID}`)
export const signUp = (email: string, name: string, phone_number: string, password: string, address?: string) =>
  new Promise((resolve, reject) =>
    userPool.signUp(email, password, [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
      new CognitoUserAttribute({ Name: 'name', Value: name }),
      new CognitoUserAttribute({ Name: 'phone_number', Value: phone_number }),
      new CognitoUserAttribute({ Name: 'address', Value: address ?? `` }),
    ], [], (error, result) =>
      error ? reject(error) : resolve(result)
    )
  );

export const signIn = (email: string, password: string) =>
  new Promise((resolve, reject) => {

    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password
    });

    console.log(`authenticationDetails: ${JSON.stringify(authenticationDetails)}`)

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool
    });

    console.log(`cognitoUser: ${JSON.stringify(cognitoUser)}`)

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: result => {
        console.log(`Successful signin: ${JSON.stringify(result)}`)
        resolve(result.getIdToken().getJwtToken())
      },
      onFailure: err => {
        console.log(`Request failure!`)
        reject(err)
      }
    });
  });