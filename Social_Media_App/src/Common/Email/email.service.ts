import type { ConfirmEmailDTO } from "../../modules/Auth/auth.dto.js";
import { SALT_ROUNDS } from "../../config/config.service.js";
import UserModel from "../../DB/Models/user.model.js";
import RedisService from "../../DB/Redis/redis.service.js";
import UserRepo from "../../DB/Repo/user.repo.js";
import { EmailEnum } from "../enums/email.enums.js";
import { BadRequestException } from "../exceptions/domain.exception.js";
import { generateOTP } from "../OTP/otp.service.js";
import { compareOperation, hashOperation } from "../security/hash.js";
import { sendEmail } from "./email.config.js";

class MailService {
  private _redisServices = RedisService;
  private _userRepo = UserRepo;
  constructor() {}
  async SendEmailOTP({
    email,
    emailType,
    subject,
  }: {
    email: string;
    emailType: EmailEnum;
    subject: string;
  }) {
    const previousOTPttl = await this._redisServices.ttl({
      key: this._redisServices.getOTPKey({ email, emailType }),
    });
    if (previousOTPttl > 0) {
      throw new BadRequestException(
        `Please wait ${previousOTPttl} seconds before requesting a new OTP`,
      );
    }

    const isBlocked = await this._redisServices.exists({
      key: this._redisServices.getOTPReqBlockedKey({ email, emailType }),
    });
    if (isBlocked) {
      throw new BadRequestException(
        "You have reached the maximum number of OTP resend attempts. Please try again after 10 minutes.",
      );
    }

    const reqNo = await this._redisServices.get({
      key: this._redisServices.getOTPReqNoKey({ email, emailType }),
    });

    if (Number(reqNo) == 5) {
      await this._redisServices.set({
        key: this._redisServices.getOTPReqBlockedKey({ email, emailType }),
        value: 1,
        exValue: 10 * 60, // Block the user from requesting a new OTP for 10 minutes after 5 failed attempts
      });
      throw new BadRequestException(
        "You have reached the maximum number of OTP resend attempts. Please try again after 10 minutes.",
      );
    }

    const generatedOTP = generateOTP();

    await sendEmail({
      to: email,
      subject: subject,
      html: `<p>Your OTP for email confirmation is: <strong>${generatedOTP}</strong></p>`,
    });

    await this._redisServices.set({
      key: this._redisServices.getOTPKey({ email, emailType }),
      value: await hashOperation({
        plainValue: generatedOTP,
        rounds: SALT_ROUNDS,
      }),
      exValue: 120, // OTP expires in 2 minutes
    });

    await this._redisServices.incr({
      key: this._redisServices.getOTPReqNoKey({ email, emailType }),
    });
  }
  async confirmEmail(bodyData : ConfirmEmailDTO) {
    const { email, otp } = bodyData;

    const user = await this._userRepo.findone({
      filter: { email, confirmEmail: false },
    });
    if (!user) {
      throw new BadRequestException("Invalid email or email already confirmed");
    }

    const storedOTP = await this._redisServices.get({
      key: this._redisServices.getOTPKey({
        email,
        emailType: EmailEnum.CONFIRM_EMAIL,
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

    // await DBRepo.updateOne({
    //   model: UserModel,
    //   filters: { email },
    //   updateData: { confirmEmail: true },
    // });

    // Another way to update the user document and set confirmEmail to true is to modify the user document directly and then save it back to the database. This approach allows you to work with the user document as a whole and make multiple changes if needed before saving it back to the database. Here's how you can do it:
    user.confirmEmail = true;
    // .save() is used to save the changes made to the user document back to the database. It will trigger any pre-save hooks defined in the UserModel schema, and it will also ensure that the updated user document is persisted in the database. This is necessary to actually update the user's confirmEmail field to true in the database after modifying it in the code.
    await user.save();

    // After confirming the email, you can choose to delete the OTP from Redis since it's no longer needed. This will help keep your Redis store clean and free of expired OTPs. You can do this by calling the redisServices.del method with the appropriate key:
    // await redisServices.del({ key: redisServices.getOTPKey({ email, emailType: EmailEnum.CONFIRM_EMAIL }) });

    return { message: "Email confirmed successfully" };
  }

  async resendConfirmationEmailOTP(email : string) {
    await this.SendEmailOTP({
      email,
      emailType: EmailEnum.CONFIRM_EMAIL,
      subject: "Resend OTP another time",
    });
    return { message: "OTP resent successfully" };
  }
}

export default new MailService();
