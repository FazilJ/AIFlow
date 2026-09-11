const {
  sanitizeAIReply,
  validateAIReply,
  getFallbackReply,
} = require("../src/service/guardrailsService");

describe("AI Guardrails", () => {
  test("should accept a normal AI response", () => {
    const result = validateAIReply({
      reply:
        "Standard delivery takes 3 to 5 business days.",
      knowledgeContext:
        "Standard delivery takes 3 to 5 business days.",
    });

    expect(result.valid).toBe(true);

    expect(result.reply).toContain(
      "Standard delivery"
    );
  });

  test("should reject an empty AI response", () => {
    const result = validateAIReply({
      reply: "",
      knowledgeContext: "",
    });

    expect(result.valid).toBe(false);

    expect(result.reply).toBe(
      getFallbackReply()
    );
  });

  test("should reject sensitive information", () => {
    const result = validateAIReply({
      reply:
        "Your api_key: secret123 is active.",
      knowledgeContext: "",
    });

    expect(result.valid).toBe(false);

    expect(result.reason).toContain(
      "sensitive"
    );
  });

  test("should reject an excessively long response", () => {
    const longReply =
      "a".repeat(4001);

    const result = validateAIReply({
      reply: longReply,
      knowledgeContext: "",
    });

    expect(result.valid).toBe(false);

    expect(result.reason).toContain(
      "maximum length"
    );
  });

  test("should sanitize null characters and whitespace", () => {
    const result =
      sanitizeAIReply(
        "  Hello Ravi\u0000  "
      );

    expect(result).toBe(
      "Hello Ravi"
    );
  });
});