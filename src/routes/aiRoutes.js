const express = require("express");

const {
  chatWithAI,
  widgetChatWithAI,
  lookupCustomer
} = require("../controllers/aiController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();
const { createTicket } = require("../tools/ticketTool");

const {
  generateEmbedding,
} = require("../service/embeddingService");

const {
  searchKnowledge,
} = require("../service/vectorSearchService");

const {
  retrieveRelevantKnowledge,
} = require("../service/ragService");


router.post(
  "/customer-lookup",
  protect,
  lookupCustomer
);

router.post(
  "/chat",
  protect,
  chatWithAI
);

router.post(
  "/widget-chat",
  widgetChatWithAI
);

router.post("/create-ticket-test", protect, async (req, res, next) => {
  try {
    const {
      businessId,
      customerId,
      subject,
      description,
      priority,
    } = req.body;

    const result = await createTicket({
      businessId,
      customerId,
      subject,
      description,
      priority,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/vector-search-test",
  protect,
  async (req, res, next) => {
    try {
      const {
        query,
        businessId,
      } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: "Query is required",
        });
      }

      if (!businessId) {
        return res.status(400).json({
          success: false,
          message: "Business ID is required",
        });
      }

      // Step 1: Convert user question into embedding
      const queryEmbedding =
        await generateEmbedding(query);

      // Step 2: Search similar knowledge chunks
      const results =
        await searchKnowledge(
          queryEmbedding,
          businessId,
          5
        );

      res.status(200).json({
        success: true,
        query,
        results,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/rag-test",
  protect,
  async (req, res, next) => {
    try {
      const {
        query,
        businessId,
      } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: "Query is required",
        });
      }

      if (!businessId) {
        return res.status(400).json({
          success: false,
          message: "Business ID is required",
        });
      }

      const result =
        await retrieveRelevantKnowledge(
          query,
          businessId,
          3
        );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);


module.exports = router;