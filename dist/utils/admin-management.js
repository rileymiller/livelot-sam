"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.signIn = void 0;
const amazon_cognito_identity_js_1 = require("amazon-cognito-identity-js");
const userPool = new amazon_cognito_identity_js_1.CognitoUserPool({
    UserPoolId: (_a = process.env.ADMIN_POOL_ID) !== null && _a !== void 0 ? _a : ``,
    ClientId: (_b = process.env.ADMIN_POOL_CLIENT_ID) !== null && _b !== void 0 ? _b : ``
});
const signIn = (email, password) => new Promise((resolve, reject) => {
    console.log(`Authenticating Admin`);
    const authenticationDetails = new amazon_cognito_identity_js_1.AuthenticationDetails({
        Username: email,
        Password: password
    });
    const cognitoAdmin = new amazon_cognito_identity_js_1.CognitoUser({
        Username: email,
        Pool: userPool
    });
    console.log(`cognitoAdmin: ${JSON.stringify(cognitoAdmin)}`);
    cognitoAdmin.authenticateUser(authenticationDetails, {
        onSuccess: result => {
            console.log(`Request success!!`);
            resolve(result.getIdToken().getJwtToken());
        },
        onFailure: err => {
            console.log(`Request failure!`);
            reject(err);
        },
        newPasswordRequired: function (userAttributes, requiredAttributes) {
            delete userAttributes.email_verified;
            delete userAttributes.phone_number_verified;
            // Get these details and call
            cognitoAdmin.completeNewPasswordChallenge(password, userAttributes, this);
        }
    });
});
exports.signIn = signIn;
//# sourceMappingURL=admin-management.js.map