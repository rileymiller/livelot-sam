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
    return await getAllUsers(event);
};
exports.handler = handler;
const getScanUserTableDTO = () => {
    var _a;
    return ({
        TableName: (_a = process.env.DynamoTable) !== null && _a !== void 0 ? _a : ``,
    });
};
const getAllUsers = async function (event) {
    console.log(`event.requestContext.requestId: ${event.requestContext.requestId}`);
    console.log(`event: ${JSON.stringify(event)}`);
    const requestID = event.requestContext.requestId;
    try {
        console.log(`Attempting scan for ${process.env.DynamoTable} table`);
        const scanDynamoDTO = getScanUserTableDTO();
        const dynamoResponse = await dynamoClient.scan(scanDynamoDTO).promise();
        console.log(`DynamoDB transaction response: ${JSON.stringify(dynamoResponse)}`);
        return {
            statusCode: 200,
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
                message: `Error scanning DynamoDB: ${JSON.stringify(e)}`
            })
        };
    }
};
//# sourceMappingURL=user-get-all.js.map