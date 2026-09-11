const { Queue } = require("bullmq");

const redisConnection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
};

const aiLogQueue = new Queue("ai-log-queue", {
  connection: redisConnection,
});

aiLogQueue.on("error", (error) => {
  console.error(
    "AI Log Queue Error:",
    error.message
  );
});

console.log(
  "AI Log Queue initialized ✅"
);

module.exports = {
  aiLogQueue,
};