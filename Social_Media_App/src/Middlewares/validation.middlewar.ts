import { z, type ZodType } from "zod";
import { BadRequestException } from "../Common/exceptions/domain.exception.js";
import type { Request, Response, NextFunction } from "express";
import { GenderEnum } from "../Common/enums/user.enums.js";

type keyRequesttype = keyof Request;
// keyof Request is a union of all the keys in the Request type, which includes 'body', 'query', 'params', etc.

// Record<keyRequesttype, ZodType> is a type that represents an object where the keys are of type keyRequesttype and the values are of type ZodType.
// This means that the validationSchema parameter of the validation function is an object where the keys are the parts of the request we want to validate (e.g., 'body', 'query', 'params') and the values are the corresponding Zod schemas for validating those parts of the request.
// Partial<Record<keyRequesttype, ZodType>> makes all the keys in the Record optional, which means that the validationSchema can have any combination of 'body', 'query', 'params', etc., and we can choose to validate only the parts of the request that we are interested in.
export function validation(
  validationSchema: Partial<Record<keyRequesttype, ZodType>>,
) {
  // zodType is the type of the zod schema that we will use to validate the request data.
  return (req: Request, res: Response, next: NextFunction) => {
    const validationErrs: { path: PropertyKey[]; message: string }[] = [];
    for (const key of Object.keys(validationSchema) as keyRequesttype[]) {
      // This returns an array of the keys in the validationSchema object, which are the keys of the Request type that we want to validate (e.g., 'body', 'query', 'params').
      const validationResult = validationSchema[key]!.safeParse(req[key]); // ! is used to assert that validationSchema[key] is not undefined, which is safe here because we are iterating over the keys of validationSchema.
      if (!validationResult.success) {
        validationErrs.push(
          ...validationResult.error.issues.map((ele) => ({
            // ... is used to spread the array of validation errors into the validationErrs array.
            path: ele.path,
            message: ele.message,
          })),
        );
      }
    }
    if (validationErrs.length > 0) {
      throw new BadRequestException("Validation Error", { validationErrs });
    }
    next();
  };
}

export const commonValidationFields = {
  userName: z
    .string()
    .min(3, "Username must be at least 3 characters long")
    .max(10, "Username must be at most 10 characters long"),
  email: z.email("Invalid email address"),
  password: z
    .string()
    .regex(
      new RegExp(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,16}$/),
      "Password must be 8-16 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character",
    ),
  age: z.number().positive("Age must be a positive number"),
  gender: z.enum(GenderEnum),
  phone: z
    .string()
    .regex(
      new RegExp(/^(\+201|00201|01)(0|1|2|5)\d{8}$/),
      "Invalid Egyptian phone number",
    ),
    otp: z.string().regex(
      new RegExp(/^\d{6}$/),
      "OTP must be a 6-digit number",
    ),
    fcmToken: z.string(),
};
