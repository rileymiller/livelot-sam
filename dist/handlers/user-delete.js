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
    return await deleteUesr(event);
};
exports.handler = handler;
const getBadRequestResponse = (message) => ({
    statusCode: 401,
    body: JSON.stringify({
        message: message
    })
});
const getDeleteUserDTO = (user) => {
    var _a;
    return ({
        TableName: (_a = process.env.DynamoTable) !== null && _a !== void 0 ? _a : ``,
        Key: {
            [`id`]: { "S": user.id },
        },
    });
};
const deleteUesr = async function (event) {
    var _a;
    console.log(`event.requestContext.requestId: ${event.requestContext.requestId}`);
    console.log(`event: ${JSON.stringify(event)}`);
    const id = (_a = event.pathParameters) === null || _a === void 0 ? void 0 : _a.id;
    console.log(`URLParams: ${event.pathParameters}`);
    console.log(`id: ${id}`);
    const body = JSON.parse(event.body || '{}');
    console.log(`Request Body: ${JSON.stringify(body)}`);
    if (!id) {
        return getBadRequestResponse(`User ID was not specified`);
    }
    try {
        console.log(`Attempting delete for ${id} in ${process.env.DynamoTable} table`);
        const deleteUserDTO = getDeleteUserDTO({ id });
        console.log(`deleteUserDTO: ${JSON.stringify(deleteUserDTO)}`);
        const dynamoResponse = await dynamoClient.deleteItem(deleteUserDTO).promise();
        console.log(`DynamoDB transaction response: ${JSON.stringify(dynamoResponse)}`);
        return {
            statusCode: 201,
            body: JSON.stringify({
                message: `User ${id} was successfully deleted`
            })
        };
    }
    catch (e) {
        console.log(`There was an error: ${JSON.stringify(e)}`);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: `Error deleteing DynamoDB item: ${JSON.stringify(e)}`
            })
        };
    }
};
//# sourceMappingURL=user-delete.js.map