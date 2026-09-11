const mongoose = require("mongoose");

const User = require("../src/models/User");
const Business = require("../src/models/Business");

const {
  getUserBusinessIds,
  hasBusinessAccess,
  requireBusinessAccess,
  validateAssigneeForBusiness,
} = require("../src/service/userAccessService");

describe("Tenant Isolation", () => {
  const adminId = new mongoose.Types.ObjectId();
  const ownerId = new mongoose.Types.ObjectId();
  const supportAgentId = new mongoose.Types.ObjectId();

  const businessA = new mongoose.Types.ObjectId();
  const businessB = new mongoose.Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();

    jest
      .spyOn(User, "findById")
      .mockReset();

    jest
      .spyOn(Business, "find")
      .mockReset();

    jest
      .spyOn(Business, "findOne")
      .mockReset();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test("admin can access all active businesses", async () => {
    Business.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        { _id: businessA },
        { _id: businessB },
      ]),
    });

    const result =
      await getUserBusinessIds(
        adminId,
        "admin"
      );

    expect(result).toHaveLength(2);
    expect(result).toEqual(
      expect.arrayContaining([
        businessA,
        businessB,
      ])
    );
  });

  test("business owner can access owned business only", async () => {
    Business.find.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue([
        { _id: businessA },
      ]),
    });

    const result =
      await getUserBusinessIds(
        ownerId,
        "business_owner"
      );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(businessA);
  });

  test("support agent can access assigned businesses only", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        _id: supportAgentId,
        role: "support_agent",
        businesses: [businessA],
      }),
    });

    const result =
      await getUserBusinessIds(
        supportAgentId,
        "support_agent"
      );

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(businessA);
    expect(result).not.toContain(businessB);
  });

  test("support agent cannot access unassigned business", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        _id: supportAgentId,
        role: "support_agent",
        businesses: [businessA],
      }),
    });

    const result =
      await hasBusinessAccess({
        userId: supportAgentId,
        role: "support_agent",
        businessId: businessB,
      });

    expect(result).toBe(false);
  });

  test("support agent can access assigned business", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        _id: supportAgentId,
        role: "support_agent",
        businesses: [businessA],
      }),
    });

    const result =
      await hasBusinessAccess({
        userId: supportAgentId,
        role: "support_agent",
        businessId: businessA,
      });

    expect(result).toBe(true);
  });

  test("requireBusinessAccess throws for unassigned support agent", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        _id: supportAgentId,
        role: "support_agent",
        businesses: [businessA],
      }),
    });

    await expect(
      requireBusinessAccess({
        userId: supportAgentId,
        role: "support_agent",
        businessId: businessB,
      })
    ).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  test("support agent can be validated as assignee for assigned business", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        _id: supportAgentId,
        name: "Support Agent",
        email: "support@aiflow.com",
        role: "support_agent",
        businesses: [businessA],
      }),
    });

    const result =
      await validateAssigneeForBusiness({
        assignedTo: supportAgentId,
        businessId: businessA,
      });

    expect(result.role).toBe(
      "support_agent"
    );
    expect(result._id).toEqual(
      supportAgentId
    );
  });

  test("support agent cannot be assigned to unassigned business", async () => {
    User.findById.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      lean: jest.fn().mockResolvedValue({
        _id: supportAgentId,
        name: "Support Agent",
        email: "support@aiflow.com",
        role: "support_agent",
        businesses: [businessA],
      }),
    });

    await expect(
      validateAssigneeForBusiness({
        assignedTo: supportAgentId,
        businessId: businessB,
      })
    ).rejects.toMatchObject({
      statusCode: 403,
    });
  });
});