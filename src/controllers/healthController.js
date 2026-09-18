const { getSystemHealth } = require("../service/healthService");

const getHealth = async (req, res) => {
  try {
    const health = await getSystemHealth();

    const allOperational = Object.values(health).every(
      (status) => status === "operational"
    );

    return res.status(allOperational ? 200 : 503).json({
      success: allOperational,
      data: health,
    });
  } catch (error) {
    console.error("Health check error:", error.message);

    return res.status(503).json({
      success: false,
      message: "System health check failed",
    });
  }
};

module.exports = {
  getHealth,
};