"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const uuid_1 = require("uuid");
aws_sdk_1.default.config.update({ region: process.env.AWS_REGION });
const s3 = new aws_sdk_1.default.S3();
const dynamoClient = new aws_sdk_1.default.DynamoDB();
// Main Lambda entry point
const handler = async (event) => {
    return await imageUploaded(event);
};
exports.handler = handler;
const getS3ImageURL = (s3BucketName, imageid, imageExtension) => `https://${s3BucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${imageid}.${imageExtension}`;
const getDynamoDBImageDTO = (imageMetadataPayload) => {
    var _a;
    return ({
        TableName: (_a = process.env.DynamoTable) !== null && _a !== void 0 ? _a : ``,
        ReturnConsumedCapacity: "TOTAL",
        Item: {
            "id": {
                S: uuid_1.v4()
            },
            "camera_id": {
                S: imageMetadataPayload.camera_id
            },
            "creation_time": {
                S: imageMetadataPayload.creation_time
            },
            "file_name": {
                S: imageMetadataPayload.file_name
            },
            "time_stamp": {
                S: imageMetadataPayload.time_stamp
            },
            "s3_image_url": {
                S: imageMetadataPayload.s3_image_url
            },
            "classifications": {
                S: imageMetadataPayload.classifications
            },
            "imageid": {
                S: imageMetadataPayload.imageid
            },
            "content_type": {
                S: imageMetadataPayload.content_type
            },
            "requestid": {
                S: imageMetadataPayload.requestid
            },
            "ip_address": {
                S: imageMetadataPayload.ip_address
            },
            "image_width": {
                N: imageMetadataPayload.image_width
            },
            "image_height": {
                N: imageMetadataPayload.image_height
            }
        }
    });
};
const imageUploaded = async function (event) {
    const SNSRecord = event.Records[0].Sns;
    const SNSMessage = JSON.parse(SNSRecord.Message);
    console.log(SNSMessage.Records[0]);
    const s3Bucket = SNSMessage.Records[0].s3;
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
    const metadata = s3Object.Metadata;
    const { camera_id, classifications, content_type, creation_time, file_name, image_height, image_width, imageid, ip_address, requestid, time_stamp, } = metadata;
    const imageExtension = file_name.substr(file_name.indexOf('.') + 1);
    console.log(`imageExtension: ${imageExtension}`);
    console.log(`image_width: ${image_width}, image_height: ${image_height}`);
    const s3_image_url = getS3ImageURL(s3BucketName, imageid, imageExtension);
    const imageMetadataPayload = {
        camera_id,
        classifications,
        content_type,
        creation_time,
        file_name,
        image_height,
        image_width,
        imageid,
        ip_address,
        requestid,
        s3_image_url,
        time_stamp,
    };
    console.log(`imageMetadataPayload: ${JSON.stringify(imageMetadataPayload)}`);
    console.log(`DynamoTable: ${process.env.DynamoTable}`);
    const dynamoPutDTO = getDynamoDBImageDTO(imageMetadataPayload);
    console.log(`dynamoPutDTO: ${JSON.stringify(dynamoPutDTO)}`);
    try {
        console.log(`attempting PUT`);
        const dynamoResponse = await dynamoClient.putItem(dynamoPutDTO).promise();
        console.log(`dynamoResponse: ${JSON.stringify(dynamoResponse)}`);
    }
    catch (e) {
        console.log(`There was an error during the DynamoDB transaction: ${JSON.stringify(e)}`);
    }
};
//# sourceMappingURL=image-uploaded.js.map