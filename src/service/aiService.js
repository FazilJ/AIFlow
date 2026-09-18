const { GoogleGenAI } = require("@google/genai");

// ======================================================
// TOOLS
// ======================================================

const {
  customerLookup,
} = require("../tools/customerTool");

const {
  getBusinessInfo,
} = require("../tools/businessTool");

const {
  bookAppointment,
} = require("../tools/appointmentTool");

const {
  createTicket,
} = require("../tools/ticketTool");

// ======================================================
// SERVICES
// ======================================================

// const {
//   saveAILog,
// } = require("./aiLogService");

const {
  aiLogQueue,
} = require("../queues/aiLogQueue");

const {
  retrieveRelevantKnowledge,
} = require("./ragService");

const {
  getConversationHistory,
} = require("./conversationMemoryService");

const {
  validateToolArguments,
} = require("./toolGuardService");

const {
  redisClient,
} = require("./redisService");

const {
  buildGuardrailInstructions,
  validateAIReply,
} = require("./guardrailsService");

// ======================================================
// MODELS
// ======================================================

const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

// ======================================================
// GEMINI
// ======================================================

let ai;

const getAIClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing from .env");
  }

  if (!ai) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  return ai;
};

// ======================================================
// CONSTANTS
// ======================================================

const MODEL_NAME =
  "gemini-3.6-flash";

const CACHE_TTL = 300;

const MAX_TOOL_ROUNDS = 5;

const MAX_TOOL_RETRIES = 2;

// ======================================================
// CACHE HELPERS
// ======================================================

const normalizeCacheText = (
  text
) => {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
};

const createAIResponseCacheKey = (
  businessId,
  userMessage
) => {
  const normalizedMessage =
    normalizeCacheText(
      userMessage
    );

  return `aiflow:ai:${businessId}:${normalizedMessage}`;
};

// ======================================================
// AI TOOLS
// ======================================================

const tools = [
  {
    functionDeclarations: [
      {
        name: "customerLookup",

        description:
          "Find a customer from the database using email, phone, or WhatsApp number.",

        parameters: {
          type: "OBJECT",

          properties: {
            email: {
              type: "STRING",
              description:
                "Customer email address",
            },

            phone: {
              type: "STRING",
              description:
                "Customer phone number",
            },

            whatsappNumber: {
              type: "STRING",
              description:
                "Customer WhatsApp number",
            },
          },
        },
      },

      {
        name: "getBusinessInfo",

        description:
          "Get business information such as name, phone, email, category, description, and working hours.",

        parameters: {
          type: "OBJECT",

          properties: {
            businessId: {
              type: "STRING",
              description:
                "The MongoDB ID of the business",
            },
          },

          required: [
            "businessId",
          ],
        },
      },

      {
        name: "bookAppointment",

        description:
          "Book an appointment for a customer at a specific business date and time.",

        parameters: {
          type: "OBJECT",

          properties: {
            businessId: {
              type: "STRING",
              description:
                "MongoDB ID of the business",
            },

            customerId: {
              type: "STRING",
              description:
                "MongoDB ID of the customer",
            },

            date: {
              type: "STRING",
              description:
                "Appointment date in YYYY-MM-DD format",
            },

            time: {
              type: "STRING",
              description:
                "Appointment time in HH:mm 24-hour format",
            },

            purpose: {
              type: "STRING",
              description:
                "Reason or purpose of the appointment",
            },
          },

          required: [
            "businessId",
            "customerId",
            "date",
            "time",
          ],
        },
      },

      {
        name: "createTicket",

        description:
          "Create a support ticket for a customer when they report a problem, issue, complaint, or request that needs support follow-up.",

        parameters: {
          type: "OBJECT",

          properties: {
            businessId: {
              type: "STRING",
              description:
                "MongoDB ID of the business",
            },

            customerId: {
              type: "STRING",
              description:
                "MongoDB ID of the customer",
            },

            subject: {
              type: "STRING",
              description:
                "Short title describing the customer issue",
            },

            description: {
              type: "STRING",
              description:
                "Detailed description of the customer's issue",
            },

            priority: {
              type: "STRING",
              enum: [
                "low",
                "medium",
                "high",
                "urgent",
              ],
              description:
                "Priority of the support ticket",
            },
          },

          required: [
            "businessId",
            "customerId",
            "subject",
            "description",
          ],
        },
      },
    ],
  },
];

// ======================================================
// EXECUTE TOOL
// ======================================================

const executeTool = async (
  functionCall
) => {
  try {
    if (
      !functionCall ||
      !functionCall.name
    ) {
      return {
        success: false,
        error: "INVALID_TOOL_CALL",
        message:
          "Invalid tool call.",
      };
    }

    const toolName =
      functionCall.name;

    const args =
      functionCall.args || {};

    // ==================================================
    // TOOL ARGUMENT VALIDATION
    // ==================================================

    const validation =
      validateToolArguments(
        toolName,
        args
      );

    if (!validation.valid) {
      console.warn(
        `Tool validation failed: ${toolName} - ${validation.message}`
      );

      return {
        success: false,
        error:
          "INVALID_TOOL_ARGUMENTS",
        message:
          validation.message,
      };
    }

    console.log(
      `Tool validation passed ✅: ${toolName}`
    );

    // ==================================================
    // EXECUTE TOOL
    // ==================================================

    if (
      toolName ===
      "customerLookup"
    ) {
      return await customerLookup(
        args
      );
    }

    if (
      toolName ===
      "getBusinessInfo"
    ) {
      return await getBusinessInfo(
        args
      );
    }

    if (
      toolName ===
      "bookAppointment"
    ) {
      return await bookAppointment(
        args
      );
    }

    if (
      toolName ===
      "createTicket"
    ) {
      return await createTicket(
        args
      );
    }

    return {
      success: false,
      error: "UNKNOWN_TOOL",
      message:
        `Unknown tool: ${toolName}`,
    };
  } catch (error) {
    console.error(
      `Tool execution failed: ${
        functionCall?.name ||
        "unknown"
      }`,
      error.message
    );

    return {
      success: false,
      error:
        "TOOL_EXECUTION_FAILED",
      message:
        "The requested action could not be completed.",
    };
  }
};

// ======================================================
// TOOL RETRY
// ======================================================

const executeToolWithRetry =
  async (
    functionCall,
    maxRetries = MAX_TOOL_RETRIES
  ) => {
    let lastError = null;

    for (
      let attempt = 1;
      attempt <= maxRetries + 1;
      attempt++
    ) {
      try {
        console.log(
          `Executing tool: ${functionCall.name} (attempt ${attempt})`
        );

        const result =
          await executeTool(
            functionCall
          );

        // ------------------------------------------------
        // Successful tool result
        // ------------------------------------------------

        if (
          result &&
          result.success !== false
        ) {
          return result;
        }

        // ------------------------------------------------
        // Validation failure should not retry
        // ------------------------------------------------

        if (
          result?.error ===
          "INVALID_TOOL_ARGUMENTS"
        ) {
          return result;
        }

        // ------------------------------------------------
        // Tool failure → retry
        // ------------------------------------------------

        lastError =
          new Error(
            result?.message ||
              "Tool execution failed"
          );
      } catch (error) {
        lastError = error;

        console.warn(
          `Tool attempt ${attempt} failed:`,
          error.message
        );
      }

      if (
        attempt <= maxRetries
      ) {
        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              500 * attempt
            )
        );
      }
    }

    return {
      success: false,
      error:
        "TOOL_RETRY_EXHAUSTED",
      message:
        lastError?.message ||
        "Tool execution failed after retries.",
    };
  };

// ======================================================
// SAVE POSTGRES AI LOG
// ======================================================

const saveAIResponseLog = async ({
  businessId,
  userMessage,
  aiResponse,
  status = "success",
  latencyMs = null,
}) => {
  try {
    await aiLogQueue.add(
      "save-ai-log",
      {
        businessId,
        userMessage,
        aiResponse,
        model: MODEL_NAME,
        status,
        latencyMs,
      },
      {
        attempts: 3,
        backoff: {
          type: "exponential",
          delay: 1000,
        },
        removeOnComplete: 100,
        removeOnFail: 500,
      }
    );

    console.log(
      "AI log job added to queue ✅"
    );
  } catch (error) {
    console.error(
      "AI log queue error:",
      error.message
    );
  }
};

// ======================================================
// GENERATE AI REPLY
// ======================================================

const generateAIReply = async (
  userMessage,
  conversationHistory = [],
  businessId
) => {
  const startTime =
    Date.now();

  try {
    // ==================================================
    // VALIDATION
    // ==================================================

    if (!businessId) {
      throw new Error(
        "Business ID is required for RAG"
      );
    }

    if (
      !userMessage ||
      !userMessage.trim()
    ) {
      throw new Error(
        "User message is required"
      );
    }

    // ==================================================
    // CACHE
    // ==================================================

    const cacheKey =
      createAIResponseCacheKey(
        businessId,
        userMessage
      );

    // Only cache stateless requests.
    // Conversation history can change the answer.
    const canUseCache =
      conversationHistory.length ===
      0;

    if (
      redisClient.isReady &&
      canUseCache
    ) {
      const cachedReply =
        await redisClient.get(
          cacheKey
        );

      if (cachedReply) {
        console.log(
          "AI Cache HIT ⚡:",
          cacheKey
        );

        return cachedReply;
      }

      console.log(
        "AI Cache MISS:",
        cacheKey
      );
    }

    // ==================================================
    // RAG
    // ==================================================

    const ragResult =
      await retrieveRelevantKnowledge(
        userMessage,
        businessId,
        3
      );

    const knowledgeContext =
      ragResult.context || "";

    console.log(
      "RAG context loaded:",
      Boolean(
        knowledgeContext
      )
    );

    // ==================================================
    // GUARDRAIL INSTRUCTIONS
    // ==================================================

    const guardrailInstructions =
      buildGuardrailInstructions({
        knowledgeContext,
      });

    // ==================================================
    // BUILD GEMINI CONTENTS
    // ==================================================

    const contents = [
      ...conversationHistory.map(
        (message) => ({
          role:
            message.senderType ===
            "customer"
              ? "user"
              : "model",

          parts: [
            {
              text:
                message.content,
            },
          ],
        })
      ),
    ];

    contents.push({
      role: "user",

      parts: [
        {
          text: `${guardrailInstructions}

Business Knowledge:
${
  knowledgeContext ||
  "No verified business knowledge was retrieved."
}

User Question:
${userMessage}`,
        },
      ],
    });

    let currentContents =
      contents;

    // ==================================================
    // MULTI-STEP TOOL LOOP
    // ==================================================

    for (
      let round = 1;
      round <= MAX_TOOL_ROUNDS;
      round++
    ) {
      console.log(
        `AI tool round ${round}/${MAX_TOOL_ROUNDS}`
      );

let response;

const maxRetries = 3;

for (let attempt = 0; attempt <= maxRetries; attempt++) {
  try {
    response = await getAIClient().models.generateContent({
      model: MODEL_NAME,

      contents: currentContents,

      config: {
        tools,
      },
    });

    // Gemini request succeeded
    break;

  } catch (error) {
    const status = error?.status || error?.code;

    // Retry only temporary Gemini server errors
    if ((status === 503 || status === 429) && attempt < maxRetries) {
      const delay = Math.pow(2, attempt + 1) * 1000;

      console.log(
        `Gemini temporary error (${status}). Retrying in ${delay / 1000}s...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));

      continue;
    }

    // Not retryable or retries exhausted
    throw error;
  }
}
      const functionCalls =
        response.functionCalls ||
        [];

      // =================================================
      // FINAL TEXT RESPONSE
      // =================================================

      if (
        functionCalls.length ===
        0
      ) {
        const validation =
          validateAIReply({
            reply:
              response.text,
            knowledgeContext,
          });

        console.log(
          "AI Guardrail Check:",
          validation.reason
        );

        const reply =
          validation.reply;

        // -----------------------------------------------
        // PostgreSQL
        // -----------------------------------------------

        await saveAIResponseLog({
          businessId,
          userMessage,
          aiResponse: reply,
          status:
            validation.valid
              ? "success"
              : "guardrail_rejected",
          latencyMs:
            Date.now() -
            startTime,
        });

        // -----------------------------------------------
        // Redis
        // -----------------------------------------------

        if (
          redisClient.isReady &&
          canUseCache &&
          reply
        ) {
          await redisClient.set(
            cacheKey,
            reply,
            {
              EX: CACHE_TTL,
            }
          );

          console.log(
            "Validated AI response cached successfully 💾"
          );
        }

        return reply;
      }

      // =================================================
      // PRESERVE FULL GEMINI MODEL CONTENT
      // IMPORTANT FOR GEMINI FUNCTION-CALL HISTORY
      // =================================================

      const modelContent =
        response.candidates?.[0]
          ?.content;

      if (!modelContent) {
        throw new Error(
          "Gemini model response content is missing"
        );
      }

      currentContents = [
        ...currentContents,
        modelContent,
      ];

      // =================================================
      // EXECUTE ALL FUNCTION CALLS
      // =================================================

      const functionResponseParts =
        [];

      for (
        const functionCall of functionCalls
      ) {
        const toolResult =
          await executeToolWithRetry(
            functionCall
          );

        console.log(
          `Tool result: ${functionCall.name}`,
          toolResult
        );

        functionResponseParts.push({
          functionResponse: {
            name:
              functionCall.name,

            response:
              toolResult,
          },
        });
      }

      // =================================================
      // SEND TOOL RESULTS BACK TO GEMINI
      // =================================================

      currentContents = [
        ...currentContents,
        {
          role: "user",

          parts:
            functionResponseParts,
        },
      ];
    }

    // ==================================================
    // MAX TOOL ROUND FALLBACK
    // ==================================================

    const fallbackReply =
      "I’m sorry, but I could not complete the requested action. Please contact support for assistance.";

    console.warn(
      "Maximum AI tool rounds reached."
    );

    await saveAIResponseLog({
      businessId,
      userMessage,
      aiResponse:
        fallbackReply,
      status:
        "tool_round_limit",
      latencyMs:
        Date.now() -
        startTime,
    });

    return fallbackReply;
  } catch (error) {
    // ==================================================
    // ERROR HANDLING
    // ==================================================

    console.error(
      "Gemini Tool Calling Error:",
      error
    );

    await saveAIResponseLog({
      businessId,
      userMessage,
      aiResponse: null,
      status: "error",
      latencyMs:
        Date.now() -
        startTime,
    });

    const aiError =
      new Error(
        "AI service is temporarily unavailable"
      );

    aiError.statusCode = 503;

    throw aiError;
  }
};

// ======================================================
// STREAM AI REPLY
// ======================================================

const streamAIReply = async (
  userMessage,
  businessId,
  conversationId = null,
  onChunk
) => {
  const startTime =
    Date.now();

  try {
    // ==================================================
    // VALIDATION
    // ==================================================

    if (!businessId) {
      throw new Error(
        "Business ID is required for RAG"
      );
    }

    if (
      !userMessage ||
      !userMessage.trim()
    ) {
      throw new Error(
        "User message is required"
      );
    }

    // ==================================================
    // CONVERSATION MEMORY
    // ==================================================

    let conversationHistory =
      [];

    if (conversationId) {
      conversationHistory =
        await getConversationHistory(
          conversationId,
          10
        );

      console.log(
        "Conversation memory loaded:",
        conversationHistory.length
      );
    }

    // ==================================================
    // RAG
    // ==================================================

    const ragResult =
      await retrieveRelevantKnowledge(
        userMessage,
        businessId,
        3
      );

    const knowledgeContext =
      ragResult.context || "";

    console.log(
      "RAG context loaded:",
      Boolean(
        knowledgeContext
      )
    );

    // ==================================================
    // GUARDRAILS
    // ==================================================

    const guardrailInstructions =
      buildGuardrailInstructions({
        knowledgeContext,
      });

    // ==================================================
    // CACHE
    // ==================================================

    const cacheKey =
      createAIResponseCacheKey(
        businessId,
        userMessage
      );

    const canUseCache =
      !conversationId &&
      conversationHistory.length ===
        0;

    if (
      redisClient.isReady &&
      canUseCache
    ) {
      const cachedReply =
        await redisClient.get(
          cacheKey
        );

      if (cachedReply) {
        console.log(
          "Streaming Cache HIT ⚡:",
          cacheKey
        );

        if (onChunk) {
          onChunk(cachedReply);
        }

        return cachedReply;
      }

      console.log(
        "Streaming Cache MISS:",
        cacheKey
      );
    }

    // ==================================================
    // BUILD CONTENTS
    // ==================================================

    const contents = [];

    for (
      const message of conversationHistory
    ) {
      contents.push({
        role:
          message.senderType ===
          "customer"
            ? "user"
            : "model",

        parts: [
          {
            text:
              message.content,
          },
        ],
      });
    }

    contents.push({
      role: "user",

      parts: [
        {
          text: `${guardrailInstructions}

Business Knowledge:
${
  knowledgeContext ||
  "No verified business knowledge was retrieved."
}

User Question:
${userMessage}`,
        },
      ],
    });

    // ==================================================
    // SAVE CUSTOMER MESSAGE
    // ==================================================

    if (conversationId) {
      await Message.create({
        conversation:
          conversationId,

        senderType:
          "customer",

        sender: null,

        content:
          userMessage.trim(),

        messageType: "text",
      });

      await Conversation.findByIdAndUpdate(
        conversationId,
        {
          lastMessageAt:
            new Date(),
        }
      );

      console.log(
        "Customer message saved 💾"
      );
    }

    // ==================================================
    // STREAM GEMINI
    // ==================================================
    //
    // Intentionally do not enable function tools here.
    // Tool-calling streaming needs a separate tool-event
    // protocol; normal streaming remains text-focused.
    // ==================================================

    const response =
      await getAIClient().models.generateContentStream(
        {
          model: MODEL_NAME,

          contents,
        }
      );

    let fullResponse = "";

    for await (
      const chunk of response
    ) {
      const text =
        chunk.text || "";

      if (!text) {
        continue;
      }

      fullResponse += text;

      if (onChunk) {
        onChunk(text);
      }
    }

    // ==================================================
    // VALIDATE STREAMED RESPONSE
    // ==================================================

    const validation =
      validateAIReply({
        reply: fullResponse,
        knowledgeContext,
      });

    console.log(
      "Streaming AI Guardrail Check:",
      validation.reason
    );

    const finalReply =
      validation.reply;

    // ==================================================
    // SAVE AI MESSAGE
    // ==================================================

    if (
      conversationId &&
      finalReply
    ) {
      await Message.create({
        conversation:
          conversationId,

        senderType: "ai",

        sender: null,

        content:
          finalReply.trim(),

        messageType: "text",

        aiMetadata: {
          model:
            MODEL_NAME,
        },
      });

      await Conversation.findByIdAndUpdate(
        conversationId,
        {
          lastMessageAt:
            new Date(),
        }
      );

      console.log(
        "AI message saved 💾"
      );
    }

    // ==================================================
    // POSTGRESQL LOG
    // ==================================================

    await saveAIResponseLog({
      businessId,
      userMessage,
      aiResponse:
        finalReply,
      status:
        validation.valid
          ? "success"
          : "guardrail_rejected",
      latencyMs:
        Date.now() -
        startTime,
    });

    // ==================================================
    // REDIS CACHE
    // ==================================================

    if (
      redisClient.isReady &&
      canUseCache &&
      finalReply
    ) {
      await redisClient.set(
        cacheKey,
        finalReply,
        {
          EX: CACHE_TTL,
        }
      );

      console.log(
        "Streaming AI response cached 💾"
      );
    }

    return finalReply;
  } catch (error) {
    console.error(
      "Gemini Streaming Error:",
      error
    );

    await saveAIResponseLog({
      businessId,
      userMessage,
      aiResponse: null,
      status: "error",
      latencyMs:
        Date.now() -
        startTime,
    });

    throw error;
  }
};

// ======================================================
// EXPORTS
// ======================================================

module.exports = {
  generateAIReply,
  streamAIReply,
};
