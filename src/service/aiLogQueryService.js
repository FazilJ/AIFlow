const { pool } = require("../config/postgres");

const getAILogs = async ({
  businessId,
  page = 1,
  limit = 20,
  status = "",
}) => {
  const offset = (page - 1) * limit;

  const values = [businessId];
  let whereClause = "WHERE business_id = $1";

  if (status) {
    values.push(status);
    whereClause += ` AND status = $${values.length}`;
  }

  const countResult = await pool.query(
    `
    SELECT COUNT(*)::int AS total
    FROM ai_logs
    ${whereClause}
    `,
    values
  );

  const total = countResult.rows[0].total;

  const logsValues = [...values, limit, offset];

  const logsResult = await pool.query(
    `
    SELECT
      id,
      business_id,
      user_message,
      ai_response,
      model,
      status,
      latency_ms,
      created_at
    FROM ai_logs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${logsValues.length - 1}
    OFFSET $${logsValues.length}
    `,
    logsValues
  );

  return {
    logs: logsResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

module.exports = {
  getAILogs,
};