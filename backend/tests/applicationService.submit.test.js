jest.mock("../src/models", () => ({
  Application: {
    findByPk: jest.fn(),
  },
  ApplicationCategory: {},
  Sector: {},
  User: {},
  Role: {},
  Document: {},
  StatusHistory: {
    create: jest.fn(),
  },
  Payment: {
    findOne: jest.fn(),
  },
  sequelize: {},
}));

const ApplicationService = require("../src/services/applicationService");
const { Application, Payment, StatusHistory } = require("../src/models");

describe("ApplicationService.submit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("blocks draft submission when payment is not completed", async () => {
    const app = {
      id: "app-1",
      applicant_id: "user-1",
      status: "draft",
      save: jest.fn(),
    };

    Application.findByPk.mockResolvedValue(app);
    Payment.findOne.mockResolvedValue(null);

    await expect(ApplicationService.submit("app-1", "user-1")).rejects.toMatchObject({
      message: "Payment must be completed before submitting the application",
      status: 400,
    });

    expect(app.save).not.toHaveBeenCalled();
    expect(StatusHistory.create).not.toHaveBeenCalled();
  });
});
