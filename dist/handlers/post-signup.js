"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
aws_sdk_1.default.config.update({ region: process.env.AWS_REGION });
const dynamoClient = new aws_sdk_1.default.DynamoDB();
// Main Lambda entry point
const handler = async (event) => {
    return await postSignup(event);
};
exports.handler = handler;
/**
 * Formats the User DynamoDB query where the user sub is the primary key.
 *
 * @param createUserPayload payload for the usre create - PUT
 */
const getDynamoDBCreateUserDTO = (createUserPayload) => {
    var _a;
    return ({
        TableName: (_a = process.env.DynamoTable) !== null && _a !== void 0 ? _a : ``,
        ReturnConsumedCapacity: "TOTAL",
        Item: {
            "id": {
                S: createUserPayload.sub
            },
            "email_address": {
                S: createUserPayload.email
            },
            "name": {
                S: createUserPayload.name
            },
            "phone_number": {
                S: createUserPayload.phone_number
            },
            "address": {
                S: createUserPayload.address
            },
            "sms_enabled": {
                BOOL: true
            },
            "camera_ids": {
                SS: [""]
            }
        }
    });
};
const postSignup = async function (event) {
    try {
        const userAttributes = event.request.userAttributes;
        const { sub, email, name, address, phone_number } = userAttributes;
        console.log(`sub: ${sub}, email: ${email}, name: ${name}, address: ${address}, phone_number: ${phone_number}`);
        const createUserPayload = {
            sub,
            name,
            email,
            phone_number,
            address,
        };
        console.log(`createUserPayload: ${JSON.stringify(createUserPayload)}`);
        console.log(`DynamoTable: ${process.env.DynamoTable}`);
        const dynamoPutDTO = getDynamoDBCreateUserDTO(createUserPayload);
        console.log(`Create User DTO: ${JSON.stringify(dynamoPutDTO)}`);
        try {
            console.log(`Attempting PUT in ${process.env.DynamoTable} table`);
            const dynamoResponse = await dynamoClient.putItem(dynamoPutDTO).promise();
            console.log(`DynamoDB transaction response: ${JSON.stringify(dynamoResponse)}`);
            return event;
        }
        catch (e) {
            console.log(`There was an error: ${JSON.stringify(e)}`);
            return event;
        }
    }
    catch (e) {
        console.log(`There was an error durring post-signup: ${JSON.stringify(e)}`);
        return {
            response: e
        };
    }
};
//# sourceMappingURL=post-signup.js.map