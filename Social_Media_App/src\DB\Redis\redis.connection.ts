import { createClient } from 'redis';
import { REDIS_URL } from '../../config/config.service.js';

export const client = createClient({
  url: REDIS_URL,
});


async function redisConnection() {
    try {
        await client.connect();
        console.log("Connected to Redis");
    } catch (error) {
        console.error("Failed to connect to Redis", error);
    }
}

export default redisConnection;