"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const aws_sdk_1 = __importDefault(require("aws-sdk"));
aws_sdk_1.default.config.update({ region: process.env.AWS_REGION });
// Main Lambda entry point
const handler = async (event) => {
    return await preSignup(event);
};
exports.handler = handler;
const preSignup = async function (event) {
    try {
        event.response = {
            ...event.response,
            autoConfirmUser: true,
            autoVerifyEmail: true,
            autoVerifyPhone: true
        };
        console.log(`Pre-signup auto-verification: ${JSON.stringify(event)}`);
        return event;
    }
    catch (e) {
        console.log(`There was an error durring pre-signup: ${JSON.stringify(e)}`);
        return {
            response: e
        };
    }
};
//# sourceMappingURL=pre-signup.js.map