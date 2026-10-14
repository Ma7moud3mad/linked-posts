import type { ObjectId } from "mongoose";
import type { EmailEnum } from "../../Common/enums/email.enums.js";
import { client } from "./redis.connection.js";

class RedisService {
  getBlacklistTokenKey({ userId, tokenId } : { userId: string | ObjectId; tokenId: string }) {
    return `blacklistToken::${userId}::${tokenId}`;
  }

  getOTPKey({ email, emailType } : { email: string; emailType: EmailEnum }) {
    return `OTP::${email}::${emailType}`;
  }

  getOTPReqNoKey({ email, emailType } : { email: string; emailType: EmailEnum }) {
    return `OTP::${email}::${emailType}::No`;
  }

  getOTPReqBlockedKey({ email, emailType } : { email: string; emailType: EmailEnum }) {
    return `OTP::${email}::${emailType}::Blocked`;
  }

  async set({ key, value, exType = "EX", exValue = 50 } : { key: string; value: string | number; exType?: "EX" | "PX" | "EXAT" | "PXAT"; exValue?: number }) {
    return await client.set(key, value, {
      expiration: { type: exType, value: Math.floor(exValue) },
    });
  }

  async incr({ key } : { key: string }) {
    return await client.incr(key);
  }

  async decr({ key } : { key: string }) {
    return await client.decr(key);
  }

  async update({ key, value } : { key: string; value: string }) {
    const exists = await client.exists(key);
    if (!exists) {
      throw new Error("Key does not exist --> 0");
    }
    return await client.set(key, value);
  }

  async remove({ keys } : { keys: string | string[] }) {
    return await client.del(keys);
  }

  async ttl({ key } : { key: string }) {
    return await client.ttl(key);
  }

  async setExpire({ key, seconds } : { key: string; seconds: number }) {
    return await client.expire(key, seconds);
  }

  async removeExpire({ key } : { key: string }) {
    return await client.persist(key);
  }

  async get({ key } : { key: string }) {
    return await client.get(key);
  }

  async mget({ keys } : { keys: string[] }) {
    return await client.mGet(keys);
  }

  async exists({ key } : { key: string }) {
    return await client.exists(key);
  }
}

export default new RedisService();