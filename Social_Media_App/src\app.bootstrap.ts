import express from "express";
import authController from "./modules/Auth/auth.controller.js";
import globalErrHandlingMiddleware from "./Middlewares/globalErr.middlewar.js";
import { SERVER_PORT } from "./config/config.service.js";
import test_DB_connections from "./DB/connections.js";
import redisConnection from "./DB/Redis/redis.connection.js";
import userController from "./modules/User/user.controller.js";
import { pipeline } from "node:stream";
import { promisify } from "node:util";
import s3bucketService from "./Common/S3Bucket/s3bucket.service.js";
import successResponse from "./Common/response/success.response.js";
import { file } from "zod";

async function bootstrap() {
  const app: express.Express = express();
  const PORT = SERVER_PORT;
  app.use(express.json());

  await test_DB_connections();
  await redisConnection();

  app.get(
    "/",
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ): void => {
      res.send("Hello World!");
    },
  );

  app.use("/auth", authController);
  app.use("/users", userController);

  app.get("/uploads/*path", async (req, res, next) => {
    console.log("Received request for file with path:", req.params);
    const { path } = req.params;
    const { filename, download } = req.query;

    const Key = path.join("/");

    const result = await s3bucketService.getFile({ Key });
    console.log("File retrieved successfully from S3 with key:", Key);
    // console.log("Result: ", result);

    const pipelinePromise = promisify(pipeline);

    if (download == "true") {
      res.setHeader(
        "content-disposition",
        `attachment; filename=${filename || path[path.length - 1]}`,
      );
    }

    await pipelinePromise(result.Body as NodeJS.ReadableStream, res);

    // console.log("Result: ", result);
    return successResponse({
      res,
      msg: "File retrieved successfully",
      data: result,
    });
  });

  app.get("/pre-signed-upload/*path", async (req, res, next) => {
    console.log("Received request for file with path:", req.params);
    const { path } = req.params;
    const { filename, download } = req.query;

    const Key = path.join("/");

    const result = await s3bucketService.createPreSignedGetFile({
      Key,
      filename: (filename as string) || (path[path.length - 1] as string), // Use the provided filename or default to the original filename from S3 if not provided then the file will be downloaded with the original filename from S3 if the download query parameter is true, otherwise it will be displayed in the browser if supported. If download is not "true", the file will be displayed in the browser if supported, without forcing a download. This allows for flexible handling of file retrieval based on the client's needs and preferences.
      download: download as string,
    });
    console.log("File retrieved successfully from S3 with key:", Key);
    console.log("Result: ", result);

    // const pipelinePromise = promisify(pipeline);

    // if (download == "true") {
    //   res.setHeader(
    //     "content-disposition",
    //     `attachment; filename=${filename || path[path.length - 1]}`,
    //   );
    // }

    //   await pipelinePromise(result.Body as NodeJS.ReadableStream, res)

    // console.log("Result: ", result);
    // return res.json({ message: "File retrieved successfully", result });
    return successResponse({
      res,
      msg: "File retrieved successfully",
      data: result,
    });
  });

  app.use(globalErrHandlingMiddleware);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export default bootstrap;
