import z from "zod";
import { GenderEnum } from "../../Common/enums/user.enums.js";
import { commonValidationFields } from "../../Middlewares/validation.middlewar.js";

export const loginSchema = {
  body: z.strictObject({
    email: commonValidationFields.email,
    password: commonValidationFields.password,
    fcmToken: commonValidationFields.fcmToken,
  }),
};

export const signupSchema = {
  body: loginSchema.body.extend({
    userName: commonValidationFields.userName,
    confirmPassword: z.string(),
    age: commonValidationFields.age.optional(),
    gender: commonValidationFields.gender.optional(),
    phone: commonValidationFields.phone.optional(),
  })
    .refine(
      (data) => {
        return data.confirmPassword === data.password;
      },
      {
        message: "Passwords don't match",
      }
    )
  };

  export const confirmEmailSchema = {
    body: z.object({
      email: commonValidationFields.email,
      otp: commonValidationFields.otp,
    }),
  };

  export const resendotpConfirmationEmailSchema = {
    body: z.object({
      email: commonValidationFields.email,
    }),
  };


  ////////////////////// Forget Password ////////////////////////////////////////

  export const sendOTPForgetPasswordSchema = {
    body: z.object({
        email: commonValidationFields.email,
    }),
}

export const verifyOTPForgotPasswordSchema = {
    body: z.object({
        email: commonValidationFields.email,
        otp: commonValidationFields.otp,
    }),
}

export const resetPasswordSchema = {
    body: verifyOTPForgotPasswordSchema.body.extend({
        newPassword: commonValidationFields.password,
        confirmNewPassword: commonValidationFields.password,
    })
        .refine(
            (data) => {
                return data.confirmNewPassword === data.newPassword;
            },
            {
                message: "Passwords don't match",
            }
        ),
}
