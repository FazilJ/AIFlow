const { getAILogs } = require("../service/aiLogQueryService");

const getAILogsData = async (req, res) => {
  try {
    const businessId =
      req.query.businessId || req.user.business;

    const page = Math.max(
      parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(parseInt(req.query.limit, 10) || 20, 1),
      100
    );

    const status = req.query.status || "";

    const result = await getAILogs({
      businessId,
      page,
      limit,
      status,
    });

    return res.status(200).json({
      success: true,
      data: result.logs,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error("AI logs error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch AI logs",
    });
  }
};

module.exports = {
  getAILogsData,
};