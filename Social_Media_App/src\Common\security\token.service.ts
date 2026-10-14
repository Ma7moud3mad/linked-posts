import {
  SIGNATURE_KEY_ADMIN,
  SIGNATURE_KEY_ADMIN_REFRESH,
  SIGNATURE_KEY_USER,
  SIGNATURE_KEY_USER_REFRESH,
} from "../../config/config.service.js";

import { RoleEnum } from "../enums/user.enums.js";
import jwt, { type SignOptions } from "jsonwebtoken";
import type { IHUser } from "../../DB/Models/user.model.js";
import { TokenTypeEnum } from "../enums/token.enums.js";

class TokenService {
    constructor() {}
    getSignatureKeyByRole(role: RoleEnum = RoleEnum.User): {
        refreshSignatureKey: string;
        accessSignatureKey: string;
    } {
        let refreshSignatureKey = "";
        let accessSignatureKey = "";
        switch (role) {
        case RoleEnum.User:
            refreshSignatureKey = SIGNATURE_KEY_USER_REFRESH;
            accessSignatureKey = SIGNATURE_KEY_USER;
            break;
        case RoleEnum.Admin:
            refreshSignatureKey = SIGNATURE_KEY_ADMIN_REFRESH;
            accessSignatureKey = SIGNATURE_KEY_ADMIN;
            break;
        }
        return { refreshSignatureKey, accessSignatureKey };
    }

    generateToken({
        payload = {},
        signatureKey,
        options = {},
    }: {
        payload?: string | object;
        signatureKey: string;
        options?: SignOptions;
    }) {
        return jwt.sign(payload, signatureKey, options);
    }

    verifyToken({
        token,
        signatureKey,
    }: {
        token: string;
        signatureKey: string;
    }) {
        try {
        return jwt.verify(token, signatureKey);
        } catch (error) {
        throw error;
        }
    }

    decodeToken(token: string) {
        return jwt.decode(token);
    }

    generateAccessAndRefreshToken(user: IHUser) {
        const { accessSignatureKey, refreshSignatureKey } = this.getSignatureKeyByRole(
        user.role,
        );

        const tokenID = crypto.randomUUID(); // Generate a unique identifier for the token (jti)

        const access_token = this.generateToken({
        signatureKey: accessSignatureKey,
        options: {
            audience: [String(user.role), TokenTypeEnum.ACCESS],
            expiresIn: "30m", // 30 minutes
            subject: user._id.toString(),
            jwtid: tokenID,
        },
        });

        const refresh_token = this.generateToken({
        signatureKey: refreshSignatureKey,
        options: {
            audience: [String(user.role), TokenTypeEnum.REFRESH],
            expiresIn: "1y",
            subject: user._id.toString(),
            jwtid: tokenID,
        },
        });

        return { access_token, refresh_token };
    }
}

export default new TokenService();