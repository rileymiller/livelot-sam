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
exports.handler = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const EmailValidator = __importStar(require("email-validator"));
const phone_1 = __importDefault(require("phone"));
aws_sdk_1.default.config.update({ region: process.env.AWS_REGION });
const dynamoClient = new aws_sdk_1.default.DynamoDB();
// Main Lambda entry point
const handler = async (event) => {
    return await updateUser(event);
};
exports.handler = handler;
const getBadRequestResponse = (message) => ({
    statusCode: 401,
    body: JSON.stringify({
        message: message
    })
});
const getUpdateUserDTO = (user) => {
    var _a;
    return ({
        TableName: (_a = process.env.DynamoTable) !== null && _a !== void 0 ? _a : ``,
        Key: {
            [`id`]: { "S": user.id },
        },
        UpdateExpression: `SET #n = :n,  camera_id = :c,  phone_number = :p, email_address = :e, address = :a`,
        ExpressionAttributeNames: {
            '#n': "name"
        },
        ExpressionAttributeValues: {
            [`:n`]: { "S": user.name },
            [`:c`]: { "S": JSON.stringify(user.cameraID) },
            [`:p`]: { "S": user.phoneNumber },
            [`:e`]: { "S": user.emailAddress },
            [`:a`]: { "S": user.address }
        },
        ReturnValues: `ALL_NEW`
    });
};
const updateUser = async function (event) {
    var _a;
    console.log(`event.requestContext.requestId: ${event.requestContext.requestId}`);
    console.log(`event: ${JSON.stringify(event)}`);
    const id = (_a = event.pathParameters) === null || _a === void 0 ? void 0 : _a.id;
    console.log(`URLParams: ${event.pathParameters}`);
    if (!id) {
        return getBadRequestResponse(`User ID was not specified`);
    }
    const body = JSON.parse(event.body || '{}');
    console.log(`Request Body: ${JSON.stringify(body)}`);
    const { name, cameraID, emailAddress, address, phoneNumber } = body;
    if (!name) {
        return getBadRequestResponse(`User's name was empty`);
    }
    if (!cameraID) {
        return getBadRequestResponse(`Camera ID was empty`);
    }
    if (cameraID.length < 1) {
        return getBadRequestResponse(`Array of camera ID's was empty`);
    }
    if (!emailAddress) {
        return getBadRequestResponse(`Email address was empty`);
    }
    if (!EmailValidator.validate(emailAddress)) {
        return getBadRequestResponse(`Invalid email address`);
    }
    if (!address) {
        return getBadRequestResponse(`Address was empty`);
    }
    if (!phoneNumber) {
        return getBadRequestResponse(`Phone number was empty`);
    }
    const formattedPhoneNumber = phone_1.default(phoneNumber);
    if (formattedPhoneNumber.length === 0) {
        return getBadRequestResponse(`Invalid phone number`);
    }
    const createUserPayload = {
        id,
        name,
        cameraID,
        emailAddress,
        address,
        phoneNumber: formattedPhoneNumber[0]
    };
    try {
        console.log(`Attempting scan for ${process.env.DynamoTable} table`);
        const updateUserDTO = getUpdateUserDTO(createUserPayload);
        const dynamoResponse = await dynamoClient.updateItem(updateUserDTO).promise();
        console.log(`DynamoDB transaction response: ${JSON.stringify(dynamoResponse)}`);
        return {
            statusCode: 201,
            body: JSON.stringify({
                message: dynamoResponse
            })
        };
    }
    catch (e) {
        console.log(`There was an error: ${JSON.stringify(e)}`);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: `Error updating DynamoDB item: ${JSON.stringify(e)}`
            })
        };
    }
};
//# sourceMappingURL=user-update.js.map