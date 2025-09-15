import * as redis from "redis";
import { logger } from "./logger";

const redisClient = redis.createClient({
  url:
    process.env.TEST_REDIS_URL ||
    process.env.REDIS_URL ||
    "redis://localhost:6379",
}) as redis.RedisClientType;

redisClient.on("error", (error) => {
  logger.error(`Redis error: ${error}`);
});

redisClient.on("connect", () => {
  logger.info("Redis client connected");
});

(async function checkRedisConnection() {
  try {
    await redisClient.connect();
    await redisClient.ping();
  } catch (err) {
    logger.error(`Failed to connect to Redis: ${err}`);
    process.exit(1);
  }
})();

export { redisClient };
