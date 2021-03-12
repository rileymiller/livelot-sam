"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
const mime_types_1 = __importDefault(require("mime-types"));
const uuid_1 = require("uuid");
aws_sdk_1.default.config.update({ region: process.env.AWS_REGION });
const s3 = new aws_sdk_1.default.S3();
// Change this value to adjust the signed URL's expiration
const URL_EXPIRATION_SECONDS = 300;
// Main Lambda entry point
const handler = async (event) => {
    return await getUploadURL(event);
};
exports.handler = handler;
const getFileExtension = (filename) => {
    if (!filename) {
        throw new Error(`No file name specified`);
    }
    if (-1 === filename.indexOf('.')) {
        throw new Error(`File Extension not specified`);
    }
    return filename.substr(filename.indexOf('.'));
};
const getUploadURL = async function (event) {
    console.log(`event.requestContext.requestId: ${event.requestContext.requestId}`);
    console.log(`event: ${JSON.stringify(event)}`);
    const requestID = event.requestContext.requestId;
    const body = JSON.parse(event.body || '{}');
    let imageMimeType;
    let imageExtension;
    try {
        imageExtension = getFileExtension(body.fileName);
        console.log(`Image Extension: ${imageExtension}`);
        imageMimeType = mime_types_1.default.lookup(imageExtension);
        console.log(`Image Mime Type: ${imageMimeType}`);
        if (!imageMimeType) {
            throw new Error('Invalid file extension');
        }
    }
    catch (e) {
        console.log(`err: ${e}`);
        return {
            statusCode: 500,
            body: JSON.stringify({ message: `${e}` })
        };
    }
    const imageMetadata = {
        camera_id: body.cameraID,
        classifications: JSON.stringify(body.classifications),
        content_type: imageMimeType,
        creation_time: body.creationTime,
        file_name: body.fileName,
        image_height: JSON.stringify(body.imageHeight),
        image_width: JSON.stringify(body.imageWidth),
        ip_address: body.ipAddress,
        time_stamp: body.timeStamp,
    };
    const imageID = uuid_1.v4();
    const Key = `${imageID}${imageExtension}`;
    // Get signed URL from S3
    const s3Params = {
        Bucket: process.env.UploadBucket,
        Key,
        Expires: URL_EXPIRATION_SECONDS,
        ContentType: imageMimeType,
        Metadata: {
            ...imageMetadata,
            imageID,
            requestID,
        },
        // This ACL makes the uploaded object publicly readable. You must also uncomment
        // the extra permission for the Lambda function in the SAM template.
        ACL: 'public-read'
    };
    console.log('Params: ', s3Params);
    let uploadURL;
    try {
        uploadURL = await s3.getSignedUrlPromise(`putObject`, s3Params);
    }
    catch (e) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: `${e}` })
        };
    }
    return {
        statusCode: 200,
        body: JSON.stringify({
            uploadURL: uploadURL,
            Key
        })
    };
};
//# sourceMappingURL=get-signed-url.js.map