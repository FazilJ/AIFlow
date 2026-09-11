const { pool } = require("../config/postgres");

const saveAILog = async ({
  businessId,
  userMessage,
  aiResponse,
  model = "gemini-3.6-flash",
  status = "success",
  latencyMs = null,
}) => {
  try {
    await pool.query(
      `
      INSERT INTO ai_logs (
        business_id,
        user_message,
        ai_response,
        model,
        status,
        latency_ms
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      `,
      [
        businessId,
        userMessage,
        aiResponse,
        model,
        status,
        latencyMs,
      ]
    );

    console.log(
      "AI log saved to PostgreSQL ✅"
    );
  } catch (error) {
    console.error(
      "AI log save failed:",
      error.message
    );
  }
};

module.exports = {
  saveAILog,
};