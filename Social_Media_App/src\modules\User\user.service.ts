import type { JwtPayload } from "jsonwebtoken";
import UserRepo from "../../DB/Repo/user.repo.js";
import redisService from "../../DB/Redis/redis.service.js";
import type { Types } from "mongoose";
import s3bucketService from "../../Common/S3Bucket/s3bucket.service.js";
import type { IHUser } from "../../DB/Models/user.model.js";
import { StorageApproachesEnum } from "../../Common/enums/multer.enums.js";
import type { CoverPicsDto, ProfilePicDto } from "./user.dto.js";
import { BadRequestException } from "../../Common/exceptions/domain.exception.js";

class UserService {
  private _userRepo = UserRepo;
  private _redisService = redisService;
  private _s3BucketService = s3bucketService;

  async uploadProfilePic(bodyData: ProfilePicDto, user: IHUser) {
    // const Key = await this._s3BucketService.uploadLargeFile({
    //   file,
    //   path: `user/${user._id}/profilePic`,
    // });

    const { Key, url } =
      await this._s3BucketService.createPreSignedUrlUploadFile({
        contentType: bodyData.contentType,
        originalname: bodyData.originalname,
        path: `user/${user._id}/profilePic`,
      });

    // if (user.profilePic) {
    //   await this._s3BucketService.deleteFile([
    //     {
    //       Key: user.profilePic,
    //     },
    //   ]);
    // }

    // console.log("Pre-signed URL for profile picture upload:", url);
    // console.log("S3 object key for profile picture:", Key);

    // user.profilePic = Key; // Update the user's profile picture URL with the S3 object key
    // await user.save(); // Save the updated user document with the new profile picture URL
    return { Key, url }; // Return the S3 object key and the pre-signed URL for uploading the profile picture
  }

  async uploadCoverPics(
    files: Express.Multer.File[],
    user: IHUser
  ) {
    // const Keys = await this._s3BucketService.uploadFiles({
    //   files,
    //   path: `user/${user._id}/coverPic`,
    //   uploadApproach: StorageApproachesEnum.Disk,
    // });


    const result = await Promise.all(
      files.map((file) =>
        this._s3BucketService.createPreSignedUrlUploadFile({
          contentType: file.mimetype,
          originalname: file.originalname,
          path: `user/${user._id}/coverPic`,
        }),
      ),
    );
    console.log({result});
    
    const keys = result.map((item) => item.Key);
    const urls = result.map((item) => item.url);

    console.log("Pre-signed URL for cover picture upload:", urls);
    console.log("S3 object key for cover picture:", keys);

    user.coverPic = [...(user.coverPic || []), ...keys]; // Update the user's cover pictures array with the new S3 object keys
    await user.save();
    return { keys, urls }; // Return the S3 object keys and the pre-signed URLs for uploading the cover pictures
  }

  async deleteUser(user: IHUser) {
    const files = await this._s3BucketService.listFolderKeys(
      `user/${user._id}`, // List all files under the user's folder in S3 to delete them when the user is deleted from the database, this ensures that all associated files are cleaned up from S3 when a user is removed from the system.
    );

    console.log("Files found in S3: ", files.Contents);

    const Keys = files.Contents?.map((file) => {
      return { Key: file.Key! };
    });

    console.log("Keys to delete from S3: ", Keys);

    // await this._s3BucketService.deleteFile(Keys as { Key: string }[]);

    if (Keys?.length) {
      const deleteResult = await this._s3BucketService.deleteFile(Keys);

      console.log("Delete result:", deleteResult);
    }

    // await user.deleteOne();

    return {
      filesCount: Keys?.length || 0,
      deletedKeys: Keys || [],
    };

    // This 2 if blocks can be used if we want to delete the profile picture and cover pictures separately without deleting all the user's files from S3, but since we are already listing all the user's files from S3 and deleting them in one request, there is no need to delete the profile picture and cover pictures separately, but I will keep these blocks here for future reference if needed.
    // if (user.profilePic) {
    //   await this._s3BucketService.deleteFile({
    //     Key: user.profilePic,
    //   });
    // }

    // if (user.coverPic?.length) {
    //   await Promise.all(
    //     user.coverPic.map((coverPic) =>
    //       this._s3BucketService.deleteFile({
    //         Key: coverPic,
    //       }),
    //     ),
    //   );
    // }
  }

  async logout(
    userId: string | Types.ObjectId,
    tokenData: JwtPayload,
    logoutOptions: string,
  ) {
    if (logoutOptions == "all") {
      await this._userRepo.updateOne({
        filter: { _id: userId },
        update: { changeCreditTime: new Date() },
      });
    } else if (logoutOptions == "current") {
      // Store the revoked token in Redis with an expiration time equal to the remaining time until the token would naturally expire, this will allow for efficient token revocation checks without the need to query the database for revoked tokens on every request, and it will also automatically clean up expired revoked tokens from Redis after their expiration time has passed.
      await this._redisService.set({
        key: this._redisService.getBlacklistTokenKey({
          userId: userId as string,
          tokenId: tokenData.jti as string,
        }),
        value: tokenData.jti as string,
        exType: "PX",
        exValue:
          60 * 60 * 24 * 365 * 1000 - (Date.now() - tokenData.iat! * 1000), // Set the expiration time for the revoked token (e.g., 1 year from now) minus the time that has already passed since the token was issued
      });
    }
  }
}

export default new UserService();
