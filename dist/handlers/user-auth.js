"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = exports.ADMIN_SIGN_IN_ENDPOINT = exports.SIGN_IN_ENDPOINT = exports.SIGN_UP_ENDPOINT = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const users = __importStar(require("../utils/user-management"));
const admins = __importStar(require("../utils/admin-management"));
const EmailValidator = __importStar(require("email-validator"));
const phone_1 = __importDefault(require("phone"));
aws_sdk_1.default.config.update({ region: process.env.AWS_REGION });
exports.SIGN_UP_ENDPOINT = `/signup`;
exports.SIGN_IN_ENDPOINT = `/signin`;
exports.ADMIN_SIGN_IN_ENDPOINT = `/admin/signin`;
// Main Lambda entry point
const handler = async (event) => {
    return await authorizeUser(event);
};
exports.handler = handler;
const getBadRequestResponse = (message) => ({
    statusCode: 401,
    body: JSON.stringify({
        message: message
    })
});
const getNotFoundResponse = () => ({
    statusCode: 404,
    body: JSON.stringify({
        message: "Route not found."
    })
});
const signUp = async ({ email, name, phone_number, password, address }) => {
    try {
        await users.signUp(email, name, phone_number, password, address);
        console.log(`INFO: successful sign-up`);
        return createResponse({ message: "Created" }, 201);
    }
    catch (e) {
        console.log(e);
        return createResponse({ message: e.message }, 400);
    }
};
const signIn = async ({ email, password }) => {
    try {
        const token = await users.signIn(email, password);
        console.log(`INFO: successful sign-in`);
        return createResponse({ token }, 201);
    }
    catch (e) {
        console.log(`ERROR: signing in: ${e}`);
        return createResponse({ message: e.message }, 400);
    }
};
const adminSignIn = async ({ email, password }) => {
    try {
        const token = await admins.signIn(email, password);
        console.log(`INFO: successful sign-in`);
        return createResponse({ token }, 201);
    }
    catch (e) {
        console.log(`ERROR: signing in: ${e}`);
        return createResponse({ message: e.message }, 400);
    }
};
const createResponse = (data = { message: "OK" }, statusCode = 200) => ({
    statusCode,
    body: JSON.stringify(data),
    headers: { "Access-Control-Allow-Origin": "*" }
});
const authorizeUser = async function (event) {
    const body = JSON.parse(event.body || '{}');
    const { email, name, phone_number, password, address } = body;
    console.log(JSON.stringify(event));
    if (!password) {
        return getBadRequestResponse(`No password specified`);
    }
    if (!email) {
        return getBadRequestResponse(`Email address was empty`);
    }
    if (!EmailValidator.validate(email)) {
        return getBadRequestResponse(`Invalid email address`);
    }
    if (event.path === exports.SIGN_UP_ENDPOINT) {
        if (!name) {
            return getBadRequestResponse(`Name was empty`);
        }
        if (!phone_number) {
            return getBadRequestResponse(`Phone number was empty`);
        }
        const formattedPhoneNumber = phone_1.default(phone_number);
        if (formattedPhoneNumber.length === 0) {
            return getBadRequestResponse(`Invalid phone number`);
        }
        return signUp({ email, name, phone_number: formattedPhoneNumber[0], password, address });
    }
    else if (event.path === exports.SIGN_IN_ENDPOINT) {
        return signIn({ email, password });
    }
    else if (event.path === exports.ADMIN_SIGN_IN_ENDPOINT) {
        return adminSignIn({ email, password });
    }
    else {
        return getNotFoundResponse();
    }
};
//# sourceMappingURL=user-auth.js.map