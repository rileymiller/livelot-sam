"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.signIn = exports.signUp = void 0;
const amazon_cognito_identity_js_1 = require("amazon-cognito-identity-js");
const userPool = new amazon_cognito_identity_js_1.CognitoUserPool({
    UserPoolId: (_a = process.env.USER_POOL_ID) !== null && _a !== void 0 ? _a : ``,
    ClientId: (_b = process.env.USER_POOL_CLIENT_ID) !== null && _b !== void 0 ? _b : ``
});
const signUp = (email, name, phone_number, password, address) => new Promise((resolve, reject) => userPool.signUp(email, password, [
    new amazon_cognito_identity_js_1.CognitoUserAttribute({ Name: 'email', Value: email }),
    new amazon_cognito_identity_js_1.CognitoUserAttribute({ Name: 'name', Value: name }),
    new amazon_cognito_identity_js_1.CognitoUserAttribute({ Name: 'phone_number', Value: phone_number }),
    new amazon_cognito_identity_js_1.CognitoUserAttribute({ Name: 'address', Value: address !== null && address !== void 0 ? address : `` }),
], [], (error, result) => error ? reject(error) : resolve(result)));
exports.signUp = signUp;
const signIn = (email, password) => new Promise((resolve, reject) => {
    const authenticationDetails = new amazon_cognito_identity_js_1.AuthenticationDetails({
        Username: email,
        Password: password
    });
    console.log(`authenticationDetails: ${JSON.stringify(authenticationDetails)}`);
    const cognitoUser = new amazon_cognito_identity_js_1.CognitoUser({
        Username: email,
        Pool: userPool
    });
    console.log(`cognitoUser: ${JSON.stringify(cognitoUser)}`);
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: result => {
            console.log(`Successful signin: ${JSON.stringify(result)}`);
            resolve(result.getIdToken().getJwtToken());
        },
        onFailure: err => {
            console.log(`Request failure!`);
            reject(err);
        }
    });
});
exports.signIn = signIn;
//# sourceMappingURL=user-management.js.map