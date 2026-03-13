// ── Admin Routes ─────────────────────────────────────────────────────
// All routes require: authenticate + authorize("admin")
//
// GET    /api/admin/users          — List users (paginated, filterable)
// POST   /api/admin/users          — Create user with any role
// PUT    /api/admin/users/:id/role — Assign role
// PUT    /api/admin/users/:id/status — Activate/deactivate
// GET    /api/admin/roles          — List all roles

const express = require("express");
const { body, query, param } = require("express-validator");
const { authenticate, authorize, validate } = require("../middleware");
const AdminService = require("../services/adminService");

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(authorize("admin"));

// ── List Users ───────────────────────────────────────────────────────
router.get(
  "/users",
  validate([
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("role").optional().isString(),
    query("search").optional().isString(),
  ]),
  async (req, res, next) => {
    try {
      const result = await AdminService.listUsers({
        page: parseInt(req.query.page, 10) || 1,
        limit: parseInt(req.query.limit, 10) || 20,
        role: req.query.role,
        search: req.query.search,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
);

// ── Create User ──────────────────────────────────────────────────────
router.post(
  "/users",
  validate([
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("roleName")
      .notEmpty()
      .isIn(["admin", "project_proponent", "scrutiny_team", "mom_team"])
      .withMessage("Invalid role"),
    body("phone").optional().matches(/^[0-9]{10}$/),
    body("organization").optional().trim(),
  ]),
  async (req, res, next) => {
    try {
      const user = await AdminService.createUser(req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }
);

// ── Assign Role ──────────────────────────────────────────────────────
router.put(
  "/users/:id/role",
  validate([
    param("id").isUUID().withMessage("Invalid user ID"),
    body("roleName")
      .notEmpty()
      .isIn(["admin", "project_proponent", "scrutiny_team", "mom_team"])
      .withMessage("Invalid role"),
  ]),
  async (req, res, next) => {
    try {
      const user = await AdminService.assignRole(req.params.id, req.body.roleName);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

// ── Activate / Deactivate ────────────────────────────────────────────
router.put(
  "/users/:id/status",
  validate([
    param("id").isUUID().withMessage("Invalid user ID"),
    body("isActive").isBoolean().withMessage("isActive must be boolean"),
  ]),
  async (req, res, next) => {
    try {
      const user = await AdminService.toggleActive(req.params.id, req.body.isActive);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

// ── List Roles ───────────────────────────────────────────────────────
router.get("/roles", async (_req, res, next) => {
  try {
    const roles = await AdminService.listRoles();
    res.json(roles);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
