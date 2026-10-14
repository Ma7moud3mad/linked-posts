import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "../../Common/exceptions/domain.exception.js";
import { encryptvalue } from "../../Common/security/encrypt.js";
import { compareOperation, hashOperation } from "../../Common/security/hash.js";
import { GOOGLE_CLIENT_ID, SALT_ROUNDS } from "../../config/config.service.js";
import type {
  LoginDTO,
  ResetPasswordDTO,
  SignupDTO,
  VerifyOTPForgotPasswordDTO,
} from "./auth.dto.js";
import TokenService from "../../Common/security/token.service.js";
import MailService from "../../Common/Email/email.service.js";
import { EmailEnum } from "../../Common/enums/email.enums.js";
import UserRepo from "../../DB/Repo/user.repo.js";
import RedisService from "../../DB/Redis/redis.service.js";
import { OAuth2Client } from "google-auth-library";
import { ProviderEnum } from "../../Common/enums/user.enums.js";
import type { IHUser } from "../../DB/Models/user.model.js";

class AuthService {
  private _userRepo = UserRepo;
  private _tokenService = TokenService;
  private _mailService = MailService;
  private _redisService = RedisService;

  constructor() {}
  public async signup(bodyData: SignupDTO) {
    const { email } = bodyData;
    const existingUser = await this._userRepo.findone({ filter: { email } });
    if (existingUser) {
      throw new ConflictException("Email already exists");
    }
    const user = await this._userRepo.create({ data: bodyData });
    return user!;
  }

  public async login(bodyData: LoginDTO) {
    const { email, password, fcmToken } = bodyData;
    // Check if email exists
    const existingUser = await this._userRepo.findone({ filter: { email } });
    if (!existingUser) {
      throw new NotFoundException("Invalid email or password");
    }

    if (!existingUser.confirmEmail) {
      throw new BadRequestException(
        "Please confirm your email before logging in",
      );
    }

    // Check if password is correct
    const isPasswordValid = await compareOperation({
      plainValue: password,
      hashvalue: existingUser.password,
    });
    if (!isPasswordValid) {
      throw new NotFoundException("Invalid email or password");
    }

    return this._tokenService.generateAccessAndRefreshToken(existingUser);
  }

  ////////////////////// Forget Password ////////////////////////////////////////

  public async sendOTPForgetPassword(email: string) {
    const user = await this._userRepo.findone({
      filter: { email },
    });

    if (!user) {
      return; // we don't want to reveal whether the email exists in our system or not, so we will just return without doing anything if the user is not found, this way we can prevent potential attackers from using this endpoint to enumerate valid email addresses in our system and it also helps to protect user privacy by not disclosing whether an email address is registered or not.
    }

    if (!user.confirmEmail) {
      throw new BadRequestException(
        "Please confirm your email before requesting a password reset",
      );
    }

    await this._mailService.SendEmailOTP({
      email,
      emailType: EmailEnum.FORGET_PASSWORD,
      subject: "Reset your password",
    });
  }

  public async resendForgetPasswordOTP(email: string) {
    await this._mailService.SendEmailOTP({
      email,
      emailType: EmailEnum.FORGET_PASSWORD,
      subject: "Resend OTP another time",
    });
    return { message: "OTP resent successfully" };
  }

  public async verifyOTPForgetPassword(bodyData: VerifyOTPForgotPasswordDTO) {
    const { email, otp } = bodyData;
    const storedOTP = await this._redisService.get({
      key: this._redisService.getOTPKey({
        email,
        emailType: EmailEnum.FORGET_PASSWORD,
      }),
    });
    if (!storedOTP) {
      throw new BadRequestException(
        "OTP has expired, please request a new one",
      );
    }
    const isOTPValid = await compareOperation({
      plainValue: otp,
      hashvalue: storedOTP,
    });

    if (!isOTPValid) {
      throw new BadRequestException("Invalid OTP");
    }
  }

  public async resetPassword(bodyData: ResetPasswordDTO) {
    const { email, newPassword, otp } = bodyData;

    await this.verifyOTPForgetPassword({ email, otp });

    const hashedPassword = await hashOperation({
      plainValue: newPassword,
      rounds: SALT_ROUNDS,
    });

    await this._userRepo.updateOne({
      filter: { email },
      update: { password: hashedPassword },
    });

    return { message: "Password reset successfully" };
  }

  /****************** Login and Signup with Google ******************/

  async verifyGoogleToken(idToken: string) {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken: idToken,
      audience: GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    return payload;
  }

  async loginWithGoogle(idToken: string) : Promise<{ access_token: string; refresh_token: string }> {
    const payloadGoogleToken = await this.verifyGoogleToken(idToken);
    if (!payloadGoogleToken) {
      throw new BadRequestException("Invalid Google token");
    }

    if (!payloadGoogleToken.email_verified) {
      throw new BadRequestException("Email not verified by Google");
    }

    const user = await this._userRepo.findone({
      filter: {
        email: payloadGoogleToken.email as string,
        provider: ProviderEnum.Google,
      },
    });

    // if (!user) {
    //   return this.signupWithGmail(idToken);
    // }

    const { access_token, refresh_token } = this._tokenService.generateAccessAndRefreshToken(user as IHUser);
    return { access_token, refresh_token };
  }

  async signupWithGmail(idToken: string): Promise<{ status: number; result: { access_token: string; refresh_token: string } }> {
    const payloadGoogleToken = await this.verifyGoogleToken(idToken);
    if (!payloadGoogleToken) {
      throw new BadRequestException("Invalid Google token");
    }

    if (!payloadGoogleToken.email_verified) {
      throw new BadRequestException("Email not verified by Google");
    }

    const user = await this._userRepo.findone({
      filter: { email: payloadGoogleToken.email as string }
    });

    if (user) {
      if (user.provider == ProviderEnum.System) {
        throw new BadRequestException(
          "Email already exists , sign in with your Email and password",
        );
      }
      return { status: 200, result: await this.loginWithGoogle(idToken) };
    }

    const [newUser] = await this._userRepo.create({
      data: {
        email: payloadGoogleToken.email,
        userName: payloadGoogleToken.name,
        profileImage: payloadGoogleToken.picture,
        provider: ProviderEnum.Google,
        confirmEmail: true,
      },
    });

    return { status: 201, result: this._tokenService.generateAccessAndRefreshToken(newUser!) };
  }
}

export default new AuthService();
