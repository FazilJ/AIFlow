const {
  validateToolArguments,
} = require("../src/service/toolGuardService");

describe("Tool Guard Service", () => {
  test("valid customer lookup should pass", () => {
    const result =
      validateToolArguments(
        "customerLookup",
        {
          email: "ravi@gmail.com",
        }
      );

    expect(result.valid).toBe(true);
  });

  test("customer lookup without identifier should fail", () => {
    const result =
      validateToolArguments(
        "customerLookup",
        {}
      );

    expect(result.valid).toBe(false);
  });

  test("valid business ID should pass", () => {
    const result =
      validateToolArguments(
        "getBusinessInfo",
        {
          businessId:
            "6a96eced1f541b3f90e9f429",
        }
      );

    expect(result.valid).toBe(true);
  });

  test("invalid business ID should fail", () => {
    const result =
      validateToolArguments(
        "getBusinessInfo",
        {
          businessId: "hello",
        }
      );

    expect(result.valid).toBe(false);
  });

  test("invalid ticket priority should fail", () => {
    const result =
      validateToolArguments(
        "createTicket",
        {
          businessId:
            "6a96eced1f541b3f90e9f429",
          customerId:
            "6aa178a113c8c5acf1edf312",
          subject:
            "Internet issue",
          description:
            "Internet is not working",
          priority: "super-high",
        }
      );

    expect(result.valid).toBe(false);
  });
});