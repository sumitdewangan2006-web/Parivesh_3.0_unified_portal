const { Application, CitizenObservation } = require("../models");

function normalizeTags(input) {
  if (!input) return null;
  const unique = Array.from(
    new Set(
      String(input)
        .split(",")
        .map((part) => part.trim().toLowerCase())
        .filter(Boolean)
    )
  );
  return unique.length ? unique.slice(0, 20).join(",") : null;
}

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function mapObservation(item) {
  const tags = item.biodiversity_tags
    ? item.biodiversity_tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return {
    id: item.id,
    application_id: item.application_id,
    citizen_name: item.citizen_name,
    observation_text: item.observation_text,
    biodiversity_tags: tags,
    latitude: item.latitude !== null ? Number(item.latitude) : null,
    longitude: item.longitude !== null ? Number(item.longitude) : null,
    status: item.status,
    has_photo: Boolean(item.photo_path),
    created_at: item.created_at,
    photo_url: item.photo_path ? `/api/citizen-audit/observations/${item.id}/photo` : null,
  };
}

class CitizenObservationService {
  static async getApplicationByReference(referenceNumber) {
    const app = await Application.findOne({
      where: { reference_number: referenceNumber },
      attributes: ["id", "reference_number", "project_name", "project_location", "project_district", "project_state", "status"],
    });

    if (!app) {
      const err = new Error("Application not found");
      err.status = 404;
      throw err;
    }

    return app;
  }

  static async submitPublicObservation(referenceNumber, payload, file, meta = {}) {
    const app = await CitizenObservationService.getApplicationByReference(referenceNumber);

    if (app.status === "draft") {
      const err = new Error("Citizen audit is enabled only after application submission");
      err.status = 400;
      throw err;
    }

    const latitude = toNumberOrNull(payload.latitude);
    const longitude = toNumberOrNull(payload.longitude);

    if (latitude !== null && (latitude < -90 || latitude > 90)) {
      const err = new Error("Latitude must be between -90 and 90");
      err.status = 400;
      throw err;
    }

    if (longitude !== null && (longitude < -180 || longitude > 180)) {
      const err = new Error("Longitude must be between -180 and 180");
      err.status = 400;
      throw err;
    }

    const created = await CitizenObservation.create({
      application_id: app.id,
      citizen_name: (payload.citizen_name || "Anonymous Citizen").trim().slice(0, 150),
      contact_email: payload.contact_email ? String(payload.contact_email).trim().slice(0, 150) : null,
      contact_phone: payload.contact_phone ? String(payload.contact_phone).trim().slice(0, 30) : null,
      observation_text: String(payload.observation_text || "").trim(),
      biodiversity_tags: normalizeTags(payload.biodiversity_tags),
      latitude,
      longitude,
      photo_path: file?.path || null,
      photo_original_name: file?.originalname || null,
      photo_mime_type: file?.mimetype || null,
      photo_size: file?.size || null,
      source: "citizen_audit",
      status: "published",
      submitted_ip: meta.ip || null,
      submitted_user_agent: meta.userAgent || null,
    });

    return {
      application: {
        id: app.id,
        reference_number: app.reference_number,
        project_name: app.project_name,
      },
      observation: mapObservation(created),
    };
  }

  static async listPublicObservations(referenceNumber) {
    const app = await CitizenObservationService.getApplicationByReference(referenceNumber);

    const observations = await CitizenObservation.findAll({
      where: { application_id: app.id, status: "published" },
      order: [["created_at", "DESC"]],
      limit: 200,
    });

    return {
      application: {
        id: app.id,
        reference_number: app.reference_number,
        project_name: app.project_name,
        project_location: app.project_location,
        project_district: app.project_district,
        project_state: app.project_state,
        status: app.status,
      },
      observations: observations.map(mapObservation),
    };
  }

  static async listForApplication(applicationId) {
    const app = await Application.findByPk(applicationId, {
      attributes: ["id", "reference_number", "project_name", "project_location", "project_district", "project_state", "status"],
    });

    if (!app) {
      const err = new Error("Application not found");
      err.status = 404;
      throw err;
    }

    const observations = await CitizenObservation.findAll({
      where: { application_id: app.id },
      order: [["created_at", "DESC"]],
      limit: 500,
    });

    return {
      application: {
        id: app.id,
        reference_number: app.reference_number,
        project_name: app.project_name,
        project_location: app.project_location,
        project_district: app.project_district,
        project_state: app.project_state,
        status: app.status,
      },
      observations: observations.map(mapObservation),
    };
  }

  static async getPublicPhoto(observationId) {
    const item = await CitizenObservation.findByPk(observationId, {
      attributes: ["id", "status", "photo_path", "photo_original_name", "photo_mime_type"],
    });

    if (!item || item.status !== "published" || !item.photo_path) {
      const err = new Error("Photo not found");
      err.status = 404;
      throw err;
    }

    return item;
  }

  static async updateStatus(observationId, status, reviewerId) {
    const item = await CitizenObservation.findByPk(observationId);
    if (!item) {
      const err = new Error("Observation not found");
      err.status = 404;
      throw err;
    }

    item.status = status;
    item.submitted_user_agent = item.submitted_user_agent || null;
    await item.save();

    return {
      id: item.id,
      status: item.status,
      reviewed_by: reviewerId,
    };
  }
}

module.exports = CitizenObservationService;
