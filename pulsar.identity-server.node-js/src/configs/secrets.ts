import dotenv from "dotenv";
import fs from "fs";

if (fs.existsSync(".env")) {
    dotenv.config({ path: ".env" });
}
export const ENVIRONMENT = process.env.NODE_ENV;
const prod = ENVIRONMENT === "production"; // Anything else is treated as 'dev'

export const MONGODB_URI = process.env["MONGODB_URI"];
export const SEND_GRID = process.env["SENDGRID_KEY"];
export const BASE_URL = process.env["BASE_URL"];
export const AUTH_SECRET_KEY = process.env["AUTH_SECRET_KEY"];
export const STREAM_SECRET_KEY = process.env["STREAM_SECRET_KEY"];
export const CLIENT_URL = process.env["CLIENT_URL"];