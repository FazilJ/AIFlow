const {
  getIntegrations,
  updateIntegration,
} = require("../service/integrationService");

// ======================================================
// GET INTEGRATIONS
// ======================================================

const getIntegrationList = async (
  req,
  res
) => {
  try {
    const businessId =
      req.requestedBusinessId;

    const integrations =
      await getIntegrations(
        businessId
      );

    return res.status(200).json({
      success: true,
      data: integrations,
    });
  } catch (error) {
    console.error(
      "Integration fetch error:",
      error.message
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Failed to fetch integrations",
    });
  }
};

// ======================================================
// UPDATE INTEGRATION
// ======================================================

const configureIntegration = async (
  req,
  res
) => {
  try {
    const {
      type,
      enabled,
    } = req.body;

    const businessId =
      req.requestedBusinessId;

    if (!type) {
      return res.status(400).json({
        success: false,
        message:
          "Integration type is required",
      });
    }

    if (typeof enabled !== "boolean") {
      return res.status(400).json({
        success: false,
        message:
          "enabled must be true or false",
      });
    }

    const integration =
      await updateIntegration({
        businessId,
        type,
        enabled,
      });

    return res.status(200).json({
      success: true,
      message:
        "Integration updated successfully",
      data: integration,
    });
  } catch (error) {
    console.error(
      "Integration update error:",
      error.message
    );

    return res.status(
      error.statusCode || 500
    ).json({
      success: false,
      message:
        error.message ||
        "Failed to update integration",
    });
  }
};

module.exports = {
  getIntegrationList,
  configureIntegration,
};