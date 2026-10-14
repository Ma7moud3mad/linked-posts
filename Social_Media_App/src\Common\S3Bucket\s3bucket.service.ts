import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  ObjectCannedACL,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import {
  S3_ACCESS_KEY_ID,
  S3_APP_NAME,
  S3_BUCKET_NAME,
  S3_REGION,
  S3_SECRET_ACCESS_KEY,
} from "./../../config/config.service.js";

import { Upload } from "@aws-sdk/lib-storage";
import { StorageApproachesEnum } from "../enums/multer.enums.js";
import { createReadStream } from "node:fs";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

class S3BucketService {
  private _client = new S3Client({
    region: S3_REGION,
    credentials: {
      accessKeyId: S3_ACCESS_KEY_ID,
      secretAccessKey: S3_SECRET_ACCESS_KEY,
    },
  });

  async uploadFile({
    file,
    path,
  }: {
    file: Express.Multer.File;
    path: string;
  }) {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: `${S3_APP_NAME}/${path}/${randomUUID()}_${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: ObjectCannedACL.private, // Set the ACL to private to restrict access to the uploaded file
    });
    await this._client.send(command);

    // console.log("File uploaded successfully to S3 with key:", command.input.Key);

    return command.input.Key!; // Return the S3 object key for later retrieval or reference
  }

  async uploadLargeFile({
    file,
    path,
    uploadApproach = StorageApproachesEnum.Disk,
  }: {
    file: Express.Multer.File;
    path: string;
    uploadApproach?: StorageApproachesEnum;
  }) {
    const command = new Upload({
      client: this._client,
      params: {
        Bucket: S3_BUCKET_NAME,
        Key: `${S3_APP_NAME}/${path}/${randomUUID()}_${file.originalname}`,
        Body:
          uploadApproach == StorageApproachesEnum.Memory
            ? file.buffer
            : createReadStream(file.path),
        ContentType: file.mimetype,
        ACL: ObjectCannedACL.private, // Set the ACL to private to restrict access to the uploaded file
      },
      // (optional) size of each part, in bytes, at least 5MB
      // partSize: 1024 * 1024 * 5,
    });

    // Listen for progress events to track the upload progress
    command.on("httpUploadProgress", (progress) => {
      console.log(
        `Upload progress: ${((progress.loaded as number) / (progress.total as number)) * 100} %`,
      );
    });

    // Wait for the upload to complete and handle any errors that may occur during the upload process this upload to s3
    const uploadedFile = await command.done();
    return uploadedFile.Key!; // Return the S3 object key for later retrieval or reference
  }

  async uploadFiles({
    files,
    path,
    uploadApproach = StorageApproachesEnum.Memory,
  }: {
    files: Express.Multer.File[];
    path: string;
    uploadApproach?: StorageApproachesEnum;
  }) {
    // Use Promise.all to upload multiple files concurrently and wait for all uploads to complete before returning the array of uploaded file keys
    const Keys = await Promise.all(
      files.map(async (file) => {
        return uploadApproach === StorageApproachesEnum.Memory
          ? this.uploadFile({ file, path })
          : this.uploadLargeFile({
              file,
              path,
              uploadApproach: StorageApproachesEnum.Disk,
            });
      }),
    );

    return Keys;
  }

  async createPreSignedUrlUploadFile({
    originalname,
    contentType,
    // file,
    path,
  }: {
    originalname: string;
    contentType: string;
    // file: Express.Multer.File;
    path: string;
  }) {
    const command = new PutObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key: `${S3_APP_NAME}/${path}/${randomUUID()}_${originalname}`,
      //   Body: file.buffer,
      ContentType: contentType,
      ACL: ObjectCannedACL.private,
    });

    const url = await getSignedUrl(this._client, command, { expiresIn: 3600 });

    return { Key: command.input.Key!, url };
  }

  async createPreSignedGetFile({
    Key,
    filename,
    download,
  }: {
    Key: string;
    filename?: string;
    download?: string;
  }) {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key,
      ResponseContentDisposition:
        download == "true" ? `attachment; filename=${filename}` : undefined, // Set the Content-Disposition header to prompt file download with the specified filename if the download query parameter is true then the file will be downloaded with the provided filename, otherwise it will be displayed in the browser if supported. If filename is not provided, it will default to the original filename from S3. If download is not "true", the file will be displayed in the browser if supported, without forcing a download. This allows for flexible handling of file retrieval based on the client's needs and preferences.
    });

    return await getSignedUrl(this._client, command, { expiresIn: 3600 });
  }

  async getFile({ Key }: { Key: string }) {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET_NAME,
      Key,
    });

    return await this._client.send(command);
  }

  async deleteFile(Keys: { Key: string }[]) {
    // This command variable can be used for deleting a single file from S3 if needed in the future. It creates a DeleteObjectCommand with the specified bucket name and object key to delete a single file from S3.
    // const command = new DeleteObjectCommand({
    //   Bucket: S3_BUCKET_NAME,
    //   Key,
    // });

    // This command variable is used to delete multiple files from S3. It creates a DeleteObjectsCommand with the specified bucket name and an array of object keys to delete multiple files from S3 in a single request, which is more efficient than deleting files one by one.
    const command = new DeleteObjectsCommand({
      Bucket: S3_BUCKET_NAME,
      Delete: { Objects: Keys },
    });

    return await this._client.send(command);
  }

  async listFolderKeys(Prefix: string) {
    const command = new ListObjectsV2Command({
      Bucket: S3_BUCKET_NAME,
      Prefix: `${S3_APP_NAME}/${Prefix}`, // List objects with the specified prefix to get all files under a specific folder or path in the S3 bucket. The prefix should include the application name and the desired folder or path to filter the objects accordingly.
    });

    return await this._client.send(command);
  }
}

export default new S3BucketService();
