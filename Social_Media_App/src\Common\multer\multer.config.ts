import multer from "multer";
import { randomUUID } from "node:crypto";
import { tmpdir } from "node:os";
import { StorageApproachesEnum } from "../enums/multer.enums.js";
import { fileFilter, allowedFileFormats } from "./multer.validation.js";

// console.log("Temporary directory for file uploads:", tmpdir());

function cloudFileUpload({
  storageApproach = StorageApproachesEnum.Memory,
  allowedFormat = allowedFileFormats.img,
  fileSize = 5,
}: {
  storageApproach?: StorageApproachesEnum;
  allowedFormat?: string[];
  fileSize?: number; // in MB
}) {
  const storage =
    storageApproach == StorageApproachesEnum.Memory
      ? multer.memoryStorage()
      : multer.diskStorage({
          destination: function (req, file, callback) {
            callback(null, tmpdir());
          },
          filename: function (req, file, callback) {
            callback(null, `${randomUUID()}-${file.originalname}`);
          },
        });

  return multer({
    storage,
    fileFilter: fileFilter(allowedFormat),
    limits: { fileSize: fileSize * 1024 * 1024 }, // Convert MB to bytes
  });
}

export default cloudFileUpload;
