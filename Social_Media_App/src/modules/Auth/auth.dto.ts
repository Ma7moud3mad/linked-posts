import type z from "zod";
import type { confirmEmailSchema, loginSchema, resendotpConfirmationEmailSchema, resetPasswordSchema, sendOTPForgetPasswordSchema, signupSchema, verifyOTPForgotPasswordSchema } from "./auth.validation.js";

export type LoginDTO = z.infer<typeof loginSchema.body>

export type SignupDTO = z.infer<typeof signupSchema.body>

export type ConfirmEmailDTO = z.infer<typeof confirmEmailSchema.body>

export type ResendOTPConfirmEmailDTO = z.infer<typeof resendotpConfirmationEmailSchema.body>

export type SendOTPForgetPasswordDTO = z.infer<typeof sendOTPForgetPasswordSchema.body>

export type VerifyOTPForgotPasswordDTO = z.infer<typeof verifyOTPForgotPasswordSchema.body>

export type ResetPasswordDTO = z.infer<typeof resetPasswordSchema.body>
