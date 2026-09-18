const request = require("supertest");
const app = require("../src/app");

const {
  createTicket,
  getTickets,
  getTicketById,
} = require("../src/service/ticketService");

const Ticket = require("../src/models/Ticket");
const Customer = require("../src/models/Customer");
const Business = require("../src/models/Business");

describe("Ticket API Tests", () => {
  test("should reject unauthenticated ticket creation", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .send({
        businessId: "6a96eced1f541b3f90e9f429",
        customerId: "6aa43092fa70139501f64a49",
        subject: "Internet issue",
        description: "Internet is not working",
        priority: "high",
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("should reject unauthenticated ticket list request", async () => {
    const response = await request(app)
      .get("/api/tickets")
      .query({
        businessId: "6a96eced1f541b3f90e9f429",
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("should reject unauthenticated single ticket request", async () => {
    const response = await request(app)
      .get("/api/tickets/6aa255383b62d44443e0f356");

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });
});


describe("Ticket Service Tests", () => {
  const businessA = "6a96eced1f541b3f90e9f429";
  const businessB = "6a97da6217de47aa3a6283f7";

  const customerA = "6aa43092fa70139501f64a49";

  const ownerA = {
    _id: "6a96d99d2bad531dce961913",
    role: "business_owner",
    businesses: [],
  };

  const ownerB = {
    _id: "6aad4fd897a45fd0e5edbcac",
    role: "business_owner",
    businesses: [],
  };

  const supportAgent = {
    _id: "6aa41e427a9bada0367460dc",
    role: "support_agent",
    businesses: [businessA],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });


  test("should reject ticket when required fields are missing", async () => {
    await expect(
      createTicket({
        user: ownerA,
        businessId: businessA,
        customerId: null,
        subject: null,
        description: null,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message:
        "Business ID, customer ID, subject and description are required",
    });
  });


  test("should return 404 when business does not exist", async () => {
    jest
      .spyOn(Business, "findById")
      .mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

    await expect(
      createTicket({
        user: ownerA,
        businessId: businessB,
        customerId: customerA,
        subject: "Internet issue",
        description: "Internet is not working",
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Business not found",
    });
  });


  test("business owner should not access another business", async () => {
    jest
      .spyOn(Business, "findById")
      .mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: businessB,
          owner: ownerB._id,
        }),
      });

    await expect(
      getTickets({
        user: ownerA,
        businessId: businessB,
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "You do not have access to this business",
    });
  });


  test("support agent should access assigned business", async () => {
    jest
      .spyOn(Business, "findById")
      .mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: businessA,
          owner: ownerA._id,
        }),
      });

    jest
      .spyOn(Ticket, "find")
      .mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

    const result = await getTickets({
      user: supportAgent,
      businessId: businessA,
    });

    expect(result).toEqual([]);

    expect(Ticket.find).toHaveBeenCalledWith({
      business: businessA,
    });
  });


  test("support agent should not access unassigned business", async () => {
    jest
      .spyOn(Business, "findById")
      .mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: businessB,
          owner: ownerB._id,
        }),
      });

    await expect(
      getTickets({
        user: supportAgent,
        businessId: businessB,
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "You do not have access to this business",
    });
  });


  test("should require businessId for non-admin users", async () => {
    await expect(
      getTickets({
        user: ownerA,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Business ID is required",
    });
  });


  test("should reject customer from another business", async () => {
    jest
      .spyOn(Business, "findById")
      .mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: businessA,
          owner: ownerA._id,
        }),
      });

    jest
      .spyOn(Customer, "findOne")
      .mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

    await expect(
      createTicket({
        user: ownerA,
        businessId: businessA,
        customerId: customerA,
        subject: "Internet issue",
        description: "Internet is not working",
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Customer not found for this business",
    });
  });


  test("should return 404 when ticket does not exist", async () => {
    jest
      .spyOn(Ticket, "findById")
      .mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });

    await expect(
      getTicketById({
        user: ownerA,
        ticketId: "6aa255383b62d44443e0f356",
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Ticket not found",
    });
  });
});