jest.mock("../src/models", () => ({
  Application: {
    findByPk: jest.fn(),
  },
  StatusHistory: {
    findOne: jest.fn(),
  },
}));

const { Application, StatusHistory } = require("../src/models");
const { ensureLinearWorkflowForMom } = require("../src/middleware/workflowGuard");

describe("ensureLinearWorkflowForMom", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("blocks applications that are not yet referred", async () => {
    Application.findByPk.mockResolvedValue({
      id: "app-1",
      reference_number: "EC-2026-00001",
      status: "submitted",
    });

    const req = { body: { application_ids: ["app-1"] } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await ensureLinearWorkflowForMom(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining("must be in Referred status"),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("blocks applications that never passed under scrutiny", async () => {
    Application.findByPk.mockResolvedValue({
      id: "app-2",
      reference_number: "EC-2026-00002",
      status: "referred",
    });
    StatusHistory.findOne.mockResolvedValue(null);

    const req = { body: { application_ids: ["app-2"] } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await ensureLinearWorkflowForMom(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining("before Under Scrutiny"),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  test("allows valid referred applications that passed scrutiny", async () => {
    Application.findByPk.mockResolvedValue({
      id: "app-3",
      reference_number: "EC-2026-00003",
      status: "referred",
    });
    StatusHistory.findOne.mockResolvedValue({ id: "hist-1" });

    const req = { body: { application_ids: ["app-3"] } };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();

    await ensureLinearWorkflowForMom(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
