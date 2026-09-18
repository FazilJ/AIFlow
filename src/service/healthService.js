const mongoose = require("mongoose");
const { pool } = require("../config/postgres");
const { redisClient } = require("./redisService");


let aiHealthCache = {
  status: "unknown",
  checkedAt: 0,
};
const checkMongoDB = async () => {
  try {
    const state = mongoose.connection.readyState;

    if (state === 1) {
      return "operational";
    }

    return "down";
  } catch (error) {
    console.error("MongoDB health check failed:", error.message);
    return "down";
  }
};

const checkPostgreSQL = async () => {
  try {
    await pool.query("SELECT 1");
    return "operational";
  } catch (error) {
    console.error("PostgreSQL health check failed:", error.message);
    return "down";
  }
};

const checkRedis = async () => {
  try {
    if (!redisClient.isReady) {
      return "down";
    }

    await redisClient.ping();

    return "operational";
  } catch (error) {
    console.error("Redis health check failed:", error.message);
    return "down";
  }
};

const checkAI = async () => {
  try {
    const now = Date.now();

    // Cache AI health result for 60 seconds
    if (
      aiHealthCache.status !== "unknown" &&
      now - aiHealthCache.checkedAt < 60000
    ) {
      return aiHealthCache.status;
    }

    if (!process.env.GEMINI_API_KEY) {
      aiHealthCache = {
        status: "down",
        checkedAt: now,
      };

      return "down";
    }

    const { GoogleGenAI } = require("@google/genai");

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3.6-flash",
      contents: "Reply with OK",
    });

    aiHealthCache = {
      status: "operational",
      checkedAt: now,
    };

    return "operational";
  } catch (error) {
    console.error("AI health check failed:", error.message);

    aiHealthCache = {
      status: "down",
      checkedAt: Date.now(),
    };

    return "down";
  }
};


const getSystemHealth = async () => {
  const [mongodb, postgresql, redis, ai] = await Promise.all([
    checkMongoDB(),
    checkPostgreSQL(),
    checkRedis(),
    checkAI(),
  ]);

  return {
    mongodb,
    postgresql,
    redis,
    ai,
  };
};

module.exports = {
  getSystemHealth,
};
