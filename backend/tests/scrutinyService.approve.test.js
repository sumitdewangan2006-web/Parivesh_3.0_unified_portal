jest.mock("../src/models", () => ({
  Application: {
    findByPk: jest.fn(),
  },
  Remark: {
    create: jest.fn(),
    findAll: jest.fn(),
  },
  StatusHistory: {
    create: jest.fn(),
  },
  User: {},
  ApplicationCategory: {},
  Sector: {},
  Document: {
    findAll: jest.fn(),
    create: jest.fn(),
  },
  GistTemplate: {
    findOne: jest.fn(),
  },
  SectorDocumentRule: {
    findAll: jest.fn(),
  },
}));

const ScrutinyService = require("../src/services/scrutinyService");
const { Application, Document, GistTemplate, Remark, SectorDocumentRule, StatusHistory } = require("../src/models");

describe("ScrutinyService.approve", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("blocks referral when mandatory checklist documents are missing", async () => {
    const app = {
      id: "app-1",
      reference_number: "EC-2026-00001",
      status: "under_scrutiny",
      mineral_type: "others",
      sector_id: 1,
      save: jest.fn(),
      toJSON: jest.fn(() => ({ id: "app-1" })),
    };

    Application.findByPk.mockResolvedValue(app);
    Document.findAll.mockResolvedValue([]);
    SectorDocumentRule.findAll.mockResolvedValue([]);

    await expect(ScrutinyService.approve("app-1", "user-1", "ok")).rejects.toMatchObject({
      status: 400,
      code: "CHECKLIST_INCOMPLETE",
      message: expect.stringContaining("mandatory documents"),
    });

    expect(app.save).not.toHaveBeenCalled();
    expect(Remark.create).not.toHaveBeenCalled();
    expect(StatusHistory.create).not.toHaveBeenCalled();
    expect(GistTemplate.findOne).not.toHaveBeenCalled();
  });
});
