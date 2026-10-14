import path from "path";
import dotenv from "dotenv";

export const NODE_ENV = process.env.NODE_ENV;

// const envpath = {
//     dev: path.resolve(".env.dev"),
//     prod: path.resolve(".env.prod"),
// }

dotenv.config({ path: path.resolve("./.env.dev") });

export const SERVER_PORT = process.env.PORT || 3000;

export const DB_URL_Local = process.env.DB_URL_Local || "";
export const DB_URL_ATLAS = process.env.DB_URL_ATLAS || "";
export const REDIS_URL = process.env.REDIS_URL as string;

export const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS as string) || 10;
export const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY as string;

export const SIGNATURE_KEY_USER = process.env
    .SIGNATURE_KEY_USER as string;
export const SIGNATURE_KEY_ADMIN = process.env
    .SIGNATURE_KEY_ADMIN as string;
export const SIGNATURE_KEY_USER_REFRESH = process.env
    .SIGNATURE_KEY_USER_REFRESH as string;
export const SIGNATURE_KEY_ADMIN_REFRESH = process.env
    .SIGNATURE_KEY_ADMIN_REFRESH as string;

export const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID as string;

export const Mail_USER = process.env.Mail_USER as string;
export const Mail_PASS = process.env.Mail_PASS as string;

export const S3_REGION = process.env.S3_REGION as string;
export const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID as string;
export const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY as string;
export const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME as string;
export const S3_APP_NAME = process.env.S3_APP_NAME as string;