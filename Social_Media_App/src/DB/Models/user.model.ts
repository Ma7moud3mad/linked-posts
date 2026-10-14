import { Schema, model, type HydratedDocument } from "mongoose";
import {
  GenderEnum,
  ProviderEnum,
  RoleEnum,
} from "../../Common/enums/user.enums.js";
import { hashOperation } from "../../Common/security/hash.js";
import { SALT_ROUNDS } from "../../config/config.service.js";
import { encryptvalue } from "../../Common/security/encrypt.js";
import { EmailEnum } from "../../Common/enums/email.enums.js";
import MailService from "../../Common/Email/email.service.js";

// 1. Create an interface representing a document in MongoDB.
export interface IUser {
  userName: string;
  email: string;
  password: string;
  provider: ProviderEnum;
  confirmEmail: boolean;
  profilePic: string;
  coverPic: string[];
  age: number;
  phone: string;
  gender: GenderEnum;
  role: RoleEnum;
  changeCreditTime: Date;
  deletedAt: Date;
  fcmToken: string;
}

export type IHUser = HydratedDocument<IUser>;

// 2. Create a Schema corresponding to the document interface.
const userSchema = new Schema<IUser>(
  {
    userName: { type: String, required: true },
    email: { type: String, required: true },
    password: {
      type: String,
      required: function (): boolean {
        return this.provider == ProviderEnum.System;
      },
    },
    confirmEmail: { type: Boolean, default: false },
    profilePic: { type: String },
    coverPic: { type: [String] },
    age: { type: Number },
    phone: { type: String },
    gender: { type: Number, enum: GenderEnum, default: GenderEnum.Male },
    provider: {
      type: Number,
      enum: ProviderEnum,
      default: ProviderEnum.System,
    },
    role: { type: Number, enum: RoleEnum, default: RoleEnum.User },
    fcmToken: { type: String },
    changeCreditTime: { type: Date },
    deletedAt: { type: Date },
  },
  { timestamps: true , strictQuery: true},
);

// Pre-save hook to hash password and encrypt phone number : this hook will run before saving a user document to the database. 
// It checks if the password field has been modified, and if so, it hashes the password using the hashOperation function and updates the password field with the hashed value. It also checks if the phone field is present and has been modified, and if so, it encrypts the phone number using the encryptvalue function and updates the phone field with the encrypted value. This ensures that sensitive information like passwords and phone numbers are securely stored in the database.
userSchema.pre("save", async function (this: IHUser & { wasNew: boolean }) {
  if (this.isModified("password")) {
    const hashedPassword = await hashOperation({
      plainValue: this.password,
      rounds: SALT_ROUNDS,
    });
    this.password = hashedPassword;
  }

  if (this.phone && this.isModified("phone")) {
    const phoneEncrypted = encryptvalue({ value: this.phone });
    this.phone = phoneEncrypted;
  }

  console.log("Pre-save hook executed for user:", this);
});

// Post-save hook to send email OTP for email confirmation : this hook will run after saving a user document to the database. 
// It checks if the document is new (wasNew) and if so, it sends an email OTP to the user's email address for email confirmation. This allows us to automatically trigger the email confirmation process whenever a new user is created.
userSchema.post("save", async function (this: IHUser & { wasNew: boolean }) {
  try {
    if (this.wasNew) {
      await MailService.SendEmailOTP({
        email: this.email,
        emailType: EmailEnum.CONFIRM_EMAIL,
        subject: "Please confirm your email",
      });
    }
  } catch (error) {
    console.error("Error sending email OTP:", error);
  }

  console.log("Post-save hook executed for user:", this);
});

// Pre-findOne hook to exclude soft-deleted documents : this hook will run before executing a findOne query on the user collection. 
// It checks if the query has a filter with paranoid set to true, and if so, it modifies the query to exclude documents that have a deletedAt field (indicating they are soft-deleted). This allows us to implement soft deletion by simply adding a deletedAt field to the user document instead of permanently deleting it from the database.
userSchema.pre(["findOne" , "find"], function () {
    console.log("Pre-findOne hook executed with filter:", this.getFilter());
    const query = this.getQuery();

    // if (query.paranoid == true) {
    //     this.setQuery({ ...query, deletedAt: { $exists: false } });
    // } else {
    //     this.setQuery({ ...query });
    // }

    // Another way to check for the presence of the paranoid filter in the query is to directly check if the paranoid property exists in the query object. If it does, we can assume that the caller intends to apply soft deletion filtering, and we can modify the query accordingly. If it doesn't exist, we can proceed with the original query without adding any additional filters. Here's how you can implement this logic: 
    if(!query.getSoftDelete){
        this.setQuery({ ...query, deletedAt: { $exists: false } });
    }
});

// 3. Create a Model.
const UserModel = model<IUser>("User", userSchema);

export default UserModel;