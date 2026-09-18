const { getAnalytics } = require("../service/analyticsService");

const getAnalyticsData = async (req, res) => {
  try {
    const businessId =
      req.query.businessId || req.user.business;

    const range = req.query.range || "7d";

    const allowedRanges = [
      "24h",
      "7d",
      "30d",
      "90d",
    ];

    if (!allowedRanges.includes(range)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid range. Use 24h, 7d, 30d, or 90d.",
      });
    }

    const analytics = await getAnalytics(
      businessId,
      range
    );

    return res.status(200).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    console.error(
      "Analytics error:",
      error.message
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch analytics",
      });
  }
};

module.exports = {
  getAnalyticsData,
};