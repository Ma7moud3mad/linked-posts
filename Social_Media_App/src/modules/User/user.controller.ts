import express, { type Request, type Response } from "express";
import successResponse from "../../Common/response/success.response.js";
import { authentication } from "../../Middlewares/authentication.middleware.js";
import userService from "./user.service.js";
import { validation } from "../../Middlewares/validation.middlewar.js";
import { logoutSchema } from "./user.validation.js";
import cloudFileUpload from "../../Common/multer/multer.config.js";
import { StorageApproachesEnum } from "../../Common/enums/multer.enums.js";
import type { IHUser } from "../../DB/Models/user.model.js";

const userController = express.Router();

userController.get("/", 
  authentication(), (req: Request, res: Response) => {
  return successResponse({
    res,
    msg: "User route is working",
    data: { user: req.user },
  });
});

userController.post("/upload-profile-pic",
  authentication(),
  cloudFileUpload({
    storageApproach: StorageApproachesEnum.Memory,
    fileSize: 25,
  }).single("profilePic"),
  async (req, res) => {
    const result = await userService.uploadProfilePic(req.body, req.user);
    // console.log(result);
    return successResponse({
      res,
      msg: "Profile picture uploaded successfully",
      data: result,
    });
  },
);

userController.post("/upload-cover-pics",
  authentication(),
  cloudFileUpload({
    storageApproach: StorageApproachesEnum.Memory,
    fileSize: 25,
  }).array("coverPics", 5), // Allow up to 5 cover pictures to be uploaded at once
  async (req, res) => {
    const result = await userService.uploadCoverPics(
      req.files as Express.Multer.File[],
      req.user as IHUser,
    );
    return successResponse({
      res,
      msg: "Cover pictures uploaded successfully",
      data: result,
    });
  },
);

userController.delete("/", 
  authentication(), async (req, res) => {
  const result = await userService.deleteUser(req.user);

  return successResponse({ res, msg: "deleted", data: result });
});

userController.get("/logout",
  authentication(),
  validation(logoutSchema),
  async (req: Request, res: Response) => {
    await userService.logout(
      req.user._id,
      req.tokenPayload,
      req.body.logoutOptions,
    );
    successResponse({ res, data: "Logged out successfully" });
  },
);

export default userController;
