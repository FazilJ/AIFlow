const Integration = require("../models/Integration");

const integrationDefinitions = [
  {
    type: "gemini",
    name: "Gemini AI",
    category: "AI",
  },
  {
    type: "whatsapp",
    name: "WhatsApp",
    category: "Channels",
  },
  {
    type: "widget",
    name: "Web Widget",
    category: "Channels",
  },
  {
    type: "mongodb",
    name: "MongoDB",
    category: "Database",
  },
  {
    type: "postgresql",
    name: "PostgreSQL",
    category: "Database",
  },
  {
    type: "redis",
    name: "Redis",
    category: "Infrastructure",
  },
];

const getIntegrations = async (businessId) => {
  const existing = await Integration.find({
    business: businessId,
  })
    .select(
      "_id business type name category status enabled createdAt updatedAt"
    )
    .lean();

  const existingMap = new Map(
    existing.map((item) => [
      item.type,
      item,
    ])
  );

  return integrationDefinitions.map(
    (definition) => {
      const saved =
        existingMap.get(
          definition.type
        );

      return (
        saved || {
          business: businessId,
          type: definition.type,
          name: definition.name,
          category: definition.category,
          status: "disconnected",
          enabled: false,
        }
      );
    }
  );
};

const updateIntegration = async ({
  businessId,
  type,
  enabled,
}) => {
  const definition =
    integrationDefinitions.find(
      (item) => item.type === type
    );

  if (!definition) {
    const error = new Error(
      "Invalid integration type"
    );

    error.statusCode = 400;
    throw error;
  }

  let status = "disconnected";

  if (enabled) {
    status =
      type === "whatsapp"
        ? "configured"
        : "connected";
  }

  const integration =
    await Integration.findOneAndUpdate(
      {
        business: businessId,
        type,
      },
      {
        business: businessId,
        type,
        name: definition.name,
        category: definition.category,
        enabled,
        status,
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    )
      .select(
        "_id business type name category status enabled createdAt updatedAt"
      )
      .lean();

  return integration;
};

module.exports = {
  getIntegrations,
  updateIntegration,
};