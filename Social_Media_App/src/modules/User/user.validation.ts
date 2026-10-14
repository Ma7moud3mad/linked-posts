import z from "zod";
import type { Express } from "express";

export const logoutSchema = {
  body: z.object({
    logoutOptions: z.enum(["current", "all"]).default("current"),
  }),
};

export const uploadProfilePicSchema = {
  body: z.object({
    originalname: z.string("originalname is required"),
    contentType: z.string("contentType is required"),
  }),
};

export const uploadCoverPicsSchema = {
  body: z.object({
    files: z
      .array(
        z.object({
          originalname: z.string("originalname is required"),
          contentType: z.string("contentType is required"),
        }),
      )
      .nonempty("At least one cover picture is required"), // Ensure that at least one cover picture is provided in the request body
  }),
};
