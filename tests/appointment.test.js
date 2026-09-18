const request = require("supertest");

const app = require("../src/app");

const {
  createAppointment,
  getAppointments,
  getAppointmentById,
} = require("../src/service/appointmentService");

const Appointment = require("../src/models/Appointment");
const Customer = require("../src/models/Customer");
const Business = require("../src/models/Business");

describe("Appointment API Tests", () => {
  // ======================================================
  // API PROTECTION TESTS
  // ======================================================

  test("should reject unauthenticated request to get appointments", async () => {
    const response = await request(app)
      .get("/api/appointments");

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("should reject unauthenticated appointment creation", async () => {
    const response = await request(app)
      .post("/api/appointments")
      .send({
        businessId: "6a96eced1f541b3f90e9f429",
        customerId: "6a96eced1f541b3f90e9f430",
        date: "2026-09-20",
        time: "10:00",
        purpose: "General consultation",
      });

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("should reject unauthenticated single appointment request", async () => {
    const response = await request(app)
      .get(
        "/api/appointments/6a9bacb0519c1210110dc7ed"
      );

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("should require authentication for appointment API", async () => {
    const response = await request(app)
      .post("/api/appointments")
      .send({});

    expect(response.statusCode).toBe(401);

    expect(response.body).toHaveProperty(
      "success",
      false
    );
  });
});


// ======================================================
// APPOINTMENT SERVICE TESTS
// ======================================================

describe("Appointment Service Tests", () => {
  const businessA = "6a96eced1f541b3f90e9f429";
  const businessB = "6a97da6217de47aa3a6283f7";

  const customerA = "6aa43092fa70139501f64a49";

  const ownerA = {
    _id: "6a96d99d2bad531dce961913",
    role: "business_owner",
    businesses: [],
  };

  const supportAgent = {
    _id: "6aa41e427a9bada0367460dc",
    role: "support_agent",
    businesses: [businessA],
  };

  const ownerB = {
    _id: "6aad4fd897a45fd0e5edbcac",
    role: "business_owner",
    businesses: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ======================================================
  // 5. MISSING REQUIRED FIELDS
  // ======================================================

  test("should reject appointment when required fields are missing", async () => {
    await expect(
      createAppointment({
        user: ownerA,
        businessId: businessA,
        customerId: null,
        date: null,
        time: null,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message:
        "Business ID, customer ID, date and time are required",
    });
  });

  // ======================================================
  // 6. BUSINESS NOT FOUND
  // ======================================================

  test("should return 404 when business does not exist", async () => {
    jest
      .spyOn(Business, "findById")
      .mockReturnValue({
        lean: jest.fn().mockResolvedValue(null),
      });

    await expect(
      createAppointment({
        user: ownerA,
        businessId: businessB,
        customerId: customerA,
        date: "2026-09-20",
        time: "10:00",
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Business not found",
    });
  });

  // ======================================================
  // 7. BUSINESS OWNER CANNOT ACCESS OTHER BUSINESS
  // ======================================================

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
      getAppointments({
        user: ownerA,
        businessId: businessB,
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      message:
        "You do not have access to this business",
    });
  });

  // ======================================================
  // 8. SUPPORT AGENT CAN ACCESS ASSIGNED BUSINESS
  // ======================================================

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
      .spyOn(Appointment, "find")
      .mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([]),
      });

    const result = await getAppointments({
      user: supportAgent,
      businessId: businessA,
    });

    expect(result).toEqual([]);
    expect(Appointment.find).toHaveBeenCalledWith({
      business: businessA,
    });
  });

  // ======================================================
  // 9. SUPPORT AGENT CANNOT ACCESS UNASSIGNED BUSINESS
  // ======================================================

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
      getAppointments({
        user: supportAgent,
        businessId: businessB,
      })
    ).rejects.toMatchObject({
      statusCode: 403,
      message:
        "You do not have access to this business",
    });
  });

  // ======================================================
  // 10. BUSINESS ID REQUIRED
  // ======================================================

  test("should require businessId for non-admin users", async () => {
    await expect(
      getAppointments({
        user: ownerA,
      })
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Business ID is required",
    });
  });

  // ======================================================
  // 11. CUSTOMER MUST BELONG TO BUSINESS
  // ======================================================

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
      createAppointment({
        user: ownerA,
        businessId: businessA,
        customerId: customerA,
        date: "2026-09-20",
        time: "10:00",
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      message:
        "Customer not found for this business",
    });
  });

  // ======================================================
  // 12. APPOINTMENT NOT FOUND
  // ======================================================

  test("should return 404 when appointment does not exist", async () => {
    jest
      .spyOn(Appointment, "findById")
      .mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null),
      });

    await expect(
      getAppointmentById({
        user: ownerA,
        appointmentId:
          "6a9bacb0519c1210110dc7ed",
      })
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Appointment not found",
    });
  });
});