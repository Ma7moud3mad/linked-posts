import type { NextFunction, Request, Response } from "express";
import { TokenTypeEnum } from "../Common/enums/token.enums.js";
import {
  BadRequestException,
  UnauthorizedException,
} from "../Common/exceptions/domain.exception.js";
import tokenService from "../Common/security/token.service.js";
import type { JwtPayload } from "jsonwebtoken";
import type { RoleEnum } from "../Common/enums/user.enums.js";
import redisService from "../DB/Redis/redis.service.js";
import UserRepo from "../DB/Repo/user.repo.js";
import type { Types } from "mongoose";

export function authentication(tokenTypeParam = TokenTypeEnum.ACCESS) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;
    if (!authorization) {
      throw new UnauthorizedException(
        "Invalid Bearer Key, Authorization header is missing",
      );
    }
    const [bearer, token] = authorization.split(" ");
    if (bearer !== "Bearer") {
      throw new BadRequestException(
        "Invalid Bearer Key, Authorization header must start with 'Bearer'",
      );
    }

    if (!token) {
      throw new UnauthorizedException(
        "Token is missing in the Authorization header",
      );
    }

    const decodedToken = tokenService.decodeToken(token) as JwtPayload;

    if (!decodedToken || !decodedToken.aud) {
      throw new UnauthorizedException(
        "Invalid token, unable to decode or missing audience claim",
      );
    }

    const [userRole, tokenType] = decodedToken.aud; // Assuming the audience claim is an array with [userRole, tokenType]

    if (tokenType !== tokenTypeParam) {
      throw new BadRequestException(
        `Invalid token type, ${tokenTypeParam.toLowerCase()} token required`,
      );
    }

    const { accessSignatureKey, refreshSignatureKey } =
      tokenService.getSignatureKeyByRole(Number(userRole) as RoleEnum);

    const signatureKey =
      tokenTypeParam === TokenTypeEnum.ACCESS
        ? accessSignatureKey
        : refreshSignatureKey;

    const verified = tokenService.verifyToken({
      token,
      signatureKey,
    }) as JwtPayload;
    // Check if the token has been revoked by looking it up in Redis using the token's unique identifier (jti) and the user's ID (sub) from the token payload, if the token is found in the blacklist, it means it has been revoked and we should reject the request with an unauthorized error.
    if (
      verified.jti &&
      (await redisService.exists({
        key: redisService.getBlacklistTokenKey({
          userId: verified.sub as string,
          tokenId: verified.jti,
        }),
      }))
    ) {
      throw new UnauthorizedException(
        "you have been logged out, please log in again",
      );
    }

    const user = await UserRepo.findById({
      id: verified.sub as string | Types.ObjectId,
    });
    if (!user) {
      throw new UnauthorizedException("Account not found , create an account");
    }

    if (new Date(verified.iat! * 1000) < user.changeCreditTime) {
      // Convert changeCreditTime to milliseconds
      throw new UnauthorizedException(
        "Token is no longer valid, please log in again",
      );
    }

    req.user = user;
    req.tokenPayload = verified; // Store the decoded token payload in the request object for later use in the controller or other middleware

    next();
  };
}
