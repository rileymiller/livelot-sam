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
const aws_sdk_1 = __importStar(require("aws-sdk"));
const twilio_1 = __importDefault(require("twilio"));
aws_sdk_1.default.config.update({ region: process.env.AWS_REGION });
const s3 = new aws_sdk_1.default.S3();
const dynamoClient = new aws_sdk_1.default.DynamoDB();
// Main Lambda entry point
const handler = async (event) => {
    return await notifyDetection(event);
};
exports.handler = handler;
const getS3ImageURL = (s3BucketName, imageid, imageExtension) => `https://${s3BucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageid}.${imageExtension}`;
// const createGetCameraIDDTO = (cameraID: string): DynamoDB.QueryInput => ({
//   TableName: process.env.DynamoTable ?? ``,
//   KeyConditionExpression: `id =  :id`,
//   ExpressionAttributeValues: {
//     [':id']: { "S": cameraID }
//   }
// })
const createGetUserFromCameraIDDTO = (cameraID) => {
    var _a;
    return ({
        TableName: (_a = process.env.DynamoTable) !== null && _a !== void 0 ? _a : ``,
        FilterExpression: `contains(#camera_ids,:id)`,
        ExpressionAttributeNames: {
            '#camera_ids': "camera_ids"
        },
        ExpressionAttributeValues: {
            [':id']: { "S": cameraID }
        }
    });
};
const sendMessageViaTwilio = async (phone_number, s3URL) => {
    // Send a text message
    const accountSid = `AC5fdff3b5352a5c28141033dbe87274a9`;
    const authToken = `a268a9882aeea764e2e51dbb4e8258fb`;
    const twilioNumber = `+15855677108`;
    const client = twilio_1.default(accountSid, authToken);
    try {
        console.log(`Preparing to send message through twilio`);
        console.log(`Sending message to ${phone_number}`);
        const message = await client.messages.create({
            body: `Vehicle detected: ${s3URL}`,
            to: phone_number,
            from: twilioNumber // a valid Twilio number
        });
        console.log(`publish response: ${JSON.stringify(message)}`);
    }
    catch (e) {
        console.log(`Error publishing SMS ${JSON.stringify(e)}`);
    }
};
const notifyDetection = async function (event) {
    console.log(`notifyDetection event: ${JSON.stringify(event)}`);
    const SNSRecord = event.Records[0].Sns;
    const SNSMessage = JSON.parse(SNSRecord.Message);
    console.log(SNSMessage.Records[0]);
    const s3Bucket = SNSMessage.Records[0].s3;
    console.log(JSON.stringify(s3Bucket));
    const { name } = s3Bucket.bucket;
    const { key } = s3Bucket.object;
    const s3BucketName = name;
    // First fetch metadata from S3
    const s3Object = await s3.headObject({ Bucket: name, Key: key }).promise();
    if (!s3Object.Metadata) {
        // Shouldn't get here
        const errorMessage = 'Cannot process photo as no metadata is set for it';
        console.error(errorMessage, { s3Object, event });
        throw new Error(errorMessage);
    }
    console.log(`s3Object: ${JSON.stringify(s3Object)}`);
    const { imageid, file_name, camera_id } = s3Object.Metadata;
    const imageExtension = file_name.substr(file_name.indexOf('.') + 1);
    const imageURL = getS3ImageURL(s3BucketName, imageid, imageExtension);
    console.log(`imageURL: ${imageURL}`);
    // Get the uploaded camera's user info
    if (!camera_id) {
        throw new Error(`Camera ID not specified`);
    }
    try {
        const getUserDTO = createGetUserFromCameraIDDTO(camera_id);
        console.log(`getUserDTO: ${JSON.stringify(getUserDTO)}`);
        const dynamoResponse = await dynamoClient.scan(getUserDTO).promise();
        console.log(`dynamoResponse: ${JSON.stringify(dynamoResponse)}`);
        const firstResponse = dynamoResponse.Items ? dynamoResponse.Items[0] : null;
        if (!firstResponse) {
            throw new Error(`No items returned with corresponding camera_id`);
        }
        const unmarshalledResponse = aws_sdk_1.DynamoDB.Converter.unmarshall(firstResponse);
        console.log(`unmarshalledResponse: ${JSON.stringify(unmarshalledResponse)}`);
        const { phone_number, sms_enabled, id } = unmarshalledResponse;
        if (!sms_enabled) {
            throw new Error(`SMS is not enabled for user: ${id}`);
        }
        if (!phone_number) {
            throw new Error(`No phone number attached to user`);
        }
        await sendMessageViaTwilio(phone_number, imageURL);
    }
    catch (e) {
        console.log(`There was an error finding a user with the camera_id: ${JSON.stringify(e)}`);
    }
};
//# sourceMappingURL=notify-detection.js.map