const { createClient } = require("redis");

const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  },
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
});

redisClient.on("error", (error) => {
  console.error("Redis Client Error:", error.message);
});

redisClient.on("connect", () => {
  console.log("Redis connecting...");
});

redisClient.on("ready", () => {
  console.log("Redis connected and ready ✅");
});

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }

  return redisClient;
};

module.exports = {
  redisClient,
  connectRedis,
};
