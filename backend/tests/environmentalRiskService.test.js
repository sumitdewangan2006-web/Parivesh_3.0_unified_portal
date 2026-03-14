jest.mock("../src/models", () => ({
  Application: {
    findByPk: jest.fn(),
  },
  ApplicationCategory: {},
  Sector: {},
  Document: {},
}));

const EnvironmentalRiskService = require("../src/services/environmentalRiskService");
const { Application } = require("../src/models");

describe("EnvironmentalRiskService.analyzeApplication", () => {
  const previousPythonFlag = process.env.ENABLE_PYTHON_RISK_ANALYZER;

  beforeAll(() => {
    process.env.ENABLE_PYTHON_RISK_ANALYZER = "false";
  });

  afterAll(() => {
    if (previousPythonFlag === undefined) {
      delete process.env.ENABLE_PYTHON_RISK_ANALYZER;
    } else {
      process.env.ENABLE_PYTHON_RISK_ANALYZER = previousPythonFlag;
    }
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("returns high risk when strong ecological risk indicators are present", async () => {
    Application.findByPk.mockResolvedValue({
      id: "app-1",
      reference_number: "EC-2026-00001",
      project_name: "Open Cast Mining Expansion",
      project_description:
        "Project located within 8 km of wildlife sanctuary. Groundwater extraction 6200 KLD. Deforestation 12 hectares planned.",
      project_location: "Near river floodplain",
      project_state: "Chhattisgarh",
      project_district: "Raipur",
      project_area: 65,
      estimated_cost: 2500000000,
      category: { id: 1, code: "A", name: "Category A" },
      sector: { id: 1, name: "Mining" },
      documents: [
        {
          id: "doc-1",
          document_type: "eia_report",
          original_name: "eia_report_phase_2.pdf",
          tag: "baseline",
          mime_type: "application/pdf",
        },
      ],
    });

    const result = await EnvironmentalRiskService.analyzeApplication("app-1");

    expect(result.risk_level).toBe("High");
    expect(result.risk_score).toBeGreaterThanOrEqual(67);
    expect(result.reasons.join(" ").toLowerCase()).toContain("wildlife");
    expect(result.reasons.join(" ").toLowerCase()).toContain("groundwater");
    expect(result.reasons.join(" ").toLowerCase()).toContain("deforestation");
    expect(result.keyword_hits.length).toBeGreaterThan(0);
    expect(result.extracted_metrics).toEqual(
      expect.objectContaining({
        wildlife_distance_km: 8,
        groundwater_usage_kld: 6200,
        deforestation_area_ha: 12,
      })
    );
  });

  test("returns low risk when only minimal risk indicators are found", async () => {
    Application.findByPk.mockResolvedValue({
      id: "app-2",
      reference_number: "EC-2026-00002",
      project_name: "Small Solar Rooftop Program",
      project_description: "Low-impact distributed rooftop solar installation.",
      project_location: "Urban industrial zone",
      project_state: "Delhi",
      project_district: "New Delhi",
      project_area: 1.5,
      estimated_cost: 20000000,
      category: { id: 2, code: "B2", name: "Category B2" },
      sector: { id: 3, name: "Energy" },
      documents: [
        {
          id: "doc-2",
          document_type: "project_report",
          original_name: "project_report.docx",
          tag: "overview",
          mime_type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      ],
    });

    const result = await EnvironmentalRiskService.analyzeApplication("app-2");

    expect(result.risk_level).toBe("Low");
    expect(result.risk_score).toBeLessThan(40);
    expect(Array.isArray(result.reasons)).toBe(true);
    expect(result.summary).toContain("risk");
    expect(result.extracted_metrics).toEqual(
      expect.objectContaining({
        wildlife_distance_km: null,
      })
    );
  });
});
