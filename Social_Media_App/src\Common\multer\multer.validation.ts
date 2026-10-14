import type { Request } from "express";
import type { FileFilterCallback } from "multer";
import { BadRequestException } from "../exceptions/domain.exception.js";

export const allowedFileFormats = {
  img: ["image/png", "image/jpg", "image/jpeg"],
  video: ["video/mp4", "video/mkv"],
  pdf: ["application/pdf"],
};

export function fileFilter(allowedFileFormats: string[]) {
  return (
    req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    if (!allowedFileFormats.includes(file.mimetype)) {
      return cb(new BadRequestException(`Unsupported file format: ${file.mimetype}`));
    }
    return cb(null, true);
  };
}


