import type z from "zod";
import type { uploadCoverPicsSchema, uploadProfilePicSchema } from "./user.validation.js";

export type ProfilePicDto = z.infer<typeof uploadProfilePicSchema.body>;
export type CoverPicsDto = z.infer<typeof uploadCoverPicsSchema.body>;