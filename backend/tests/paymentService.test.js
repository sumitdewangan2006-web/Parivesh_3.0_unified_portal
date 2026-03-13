jest.mock("uuid", () => ({
  v4: jest.fn(() => "12345678-abcd-1234-abcd-1234567890ab"),
}));

jest.mock("../src/models", () => ({
  Payment: {
    findByPk: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
  },
  Application: {
    findByPk: jest.fn(),
  },
  StatusHistory: {
    create: jest.fn(),
  },
}));

const PaymentService = require("../src/services/paymentService");
const { Payment, Application, StatusHistory } = require("../src/models");

describe("PaymentService.calculateFee", () => {
  test("returns INR 50,000 when cost is below 50 crore", () => {
    expect(PaymentService.calculateFee(49 * 1_00_00_000)).toBe(50000);
  });

  test("returns INR 1,00,000 when cost is between 50 and 100 crore", () => {
    expect(PaymentService.calculateFee(50 * 1_00_00_000)).toBe(100000);
    expect(PaymentService.calculateFee(100 * 1_00_00_000)).toBe(100000);
  });

  test("returns INR 2,00,000 when cost is above 100 crore", () => {
    expect(PaymentService.calculateFee(101 * 1_00_00_000)).toBe(200000);
  });
});

describe("PaymentService.confirm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("completes payment and auto-submits draft application", async () => {
    const payment = {
      id: "pay-1",
      user_id: "user-1",
      application_id: "app-1",
      status: "pending",
      save: jest.fn().mockResolvedValue(undefined),
    };

    const app = {
      id: "app-1",
      status: "draft",
      save: jest.fn().mockResolvedValue(undefined),
    };

    Payment.findByPk.mockResolvedValue(payment);
    Application.findByPk.mockResolvedValue(app);
    StatusHistory.create.mockResolvedValue({});

    await PaymentService.confirm("pay-1", "user-1");

    expect(payment.status).toBe("completed");
    expect(payment.transaction_id).toMatch(/^TXN-/);
    expect(payment.save).toHaveBeenCalledTimes(1);

    expect(app.status).toBe("submitted");
    expect(app.submitted_at).toBeInstanceOf(Date);
    expect(app.save).toHaveBeenCalledTimes(1);

    expect(StatusHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        application_id: "app-1",
        changed_by: "user-1",
        from_status: "draft",
        to_status: "submitted",
      })
    );
  });
});
