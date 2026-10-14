import type { JwtPayload } from "jsonwebtoken"
import type { IHUser } from "../../DB/Models/user.model.js"

declare module "express-serve-static-core" {
    interface Request {
        user: IHUser;
        tokenPayload: JwtPayload
    }
}