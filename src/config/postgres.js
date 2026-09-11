const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "127.0.0.1",
  port: Number(process.env.POSTGRES_PORT || 5432),
  database: process.env.POSTGRES_DB || "aiflow",
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD,

  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on("error", (error) => {
  console.error(
    "PostgreSQL pool error:",
    error
  );
});

const connectPostgres = async () => {
  try {
    console.log("Connecting to PostgreSQL...");

    const client = await pool.connect();

    try {
      await client.query("SELECT 1");

      console.log(
        "PostgreSQL connected successfully ✅"
      );

      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error(
      "PostgreSQL connection failed ❌"
    );

    console.error(
      "Error name:",
      error?.name
    );

    console.error(
      "Error message:",
      error?.message
    );

    console.error(
      "Error code:",
      error?.code
    );

    console.error(
      "Error stack:",
      error?.stack
    );

    return false;
  }
};

module.exports = {
  pool,
  connectPostgres,
};