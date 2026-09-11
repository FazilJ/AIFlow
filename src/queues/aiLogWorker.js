const { Worker } = require("bullmq");

const {
  saveAILog,
} = require("../service/aiLogService");

const redisConnection = {
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT),
  username: process.env.REDIS_USERNAME,
  password: process.env.REDIS_PASSWORD,
};

const aiLogWorker = new Worker(
  "ai-log-queue",
  async (job) => {
    console.log(
      `Processing AI log job: ${job.id}`
    );

    await saveAILog(
      job.data
    );

    console.log(
      `AI log job completed ✅: ${job.id}`
    );
  },
  {
    connection: redisConnection,
    concurrency: 5,
  }
);

aiLogWorker.on(
  "completed",
  (job) => {
    console.log(
      `AI log worker completed ✅: ${job.id}`
    );
  }
);

aiLogWorker.on(
  "failed",
  (job, error) => {
    console.error(
      `AI log worker failed ❌: ${job?.id}`,
      error.message
    );
  }
);

aiLogWorker.on(
  "error",
  (error) => {
    console.error(
      "AI Log Worker Error:",
      error.message
    );
  }
);

console.log(
  "AI Log Worker started ✅"
);

module.exports = {
  aiLogWorker,
};

