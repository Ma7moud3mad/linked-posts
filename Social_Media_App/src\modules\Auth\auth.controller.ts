import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import AuthService from "./auth.service.js";
import successResponse from "../../Common/response/success.response.js";
import {
  confirmEmailSchema,
  loginSchema,
  resendotpConfirmationEmailSchema,
  resetPasswordSchema,
  sendOTPForgetPasswordSchema,
  signupSchema,
  verifyOTPForgotPasswordSchema,
} from "./auth.validation.js";
import { validation } from "../../Middlewares/validation.middlewar.js";
import { NotFoundException } from "../../Common/exceptions/domain.exception.js";
import emailService from "../../Common/Email/email.service.js";

const authController = express.Router();
authController.get("/", (req: Request, res: Response, next: NextFunction) => {
  return successResponse({ res, msg: "Auth route is working" });
});

authController.post( "/signup",
  validation(signupSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.signup(req.body);
    return successResponse<any>({
      res,
      msg: "Signup successful , Check your email to confirm it",
      data: result,
    });
  },
);

authController.post( "/login",
  validation(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    const result = await AuthService.login(req.body);
    return successResponse<{ access_token: string; refresh_token: string }>({
      res,
      msg: "Login successful",
      data: result,
    });
  },
);

authController.post( "/confirm-email",
  validation(confirmEmailSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    await emailService.confirmEmail(req.body);
    return successResponse({
      res,
      data: { message: "Email confirmed successfully" },
    });
  },
);

authController.post( "/resend-otp-confirm-email",
  validation(resendotpConfirmationEmailSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    await emailService.resendConfirmationEmailOTP(req.body.email);
    return successResponse({
      res,
      data: { message: "OTP resent successfully, please check your email" },
    });
  },
);

////////////////////// Forget Password ////////////////////////////////////////

authController.post( "/send-otp-forget-password",
  validation(sendOTPForgetPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    await AuthService.sendOTPForgetPassword(req.body.email);
    successResponse({
      res,
      statusCode: 200,
      data: { message: "OTP sent successfully, please check your email" },
    });
  },
);

authController.post( "/resend-otp-reset-password",
  validation(resendotpConfirmationEmailSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    await AuthService.resendForgetPasswordOTP(req.body.email);
    successResponse({
      res,
      statusCode: 200,
      data: { message: "OTP resent successfully, please check your email" },
    });
  },
);

authController.post( "/verify-otp-forget-password",
  validation(verifyOTPForgotPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    await AuthService.verifyOTPForgetPassword(req.body);
    successResponse({
      res,
      statusCode: 200,
      data: {message: "OTP verified successfully" },
    });
  },
);

authController.post( "/reset-password",
  validation(resetPasswordSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    await AuthService.resetPassword(req.body);
    successResponse({
      res,
      statusCode: 200,
      data: { message: "Password reset successfully" },
    });
  },
);

export default authController;
