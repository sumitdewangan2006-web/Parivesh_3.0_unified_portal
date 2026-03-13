// ── Auth Routes ──────────────────────────────────────────────────────
// POST /api/auth/register   — Register new project proponent
// POST /api/auth/login      — Login and receive JWT
// GET  /api/auth/me         — Get current user profile
// PUT  /api/auth/profile    — Update profile
// PUT  /api/auth/password   — Change password

const express = require("express");
const { body } = require("express-validator");
const { authenticate, validate } = require("../middleware");
const AuthService = require("../services/authService");

const router = express.Router();

// ── Validation Rules ─────────────────────────────────────────────────

const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("Password must contain an uppercase letter")
    .matches(/[0-9]/)
    .withMessage("Password must contain a number"),
  body("phone")
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone must be 10 digits"),
  body("organization").optional().trim(),
];

const loginRules = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const profileRules = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty"),
  body("phone")
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone must be 10 digits"),
  body("organization").optional().trim(),
];

const passwordRules = [
  body("currentPassword").notEmpty().withMessage("Current password required"),
  body("newPassword")
    .isLength({ min: 8 })
    .withMessage("New password must be at least 8 characters")
    .matches(/[A-Z]/)
    .withMessage("New password must contain an uppercase letter")
    .matches(/[0-9]/)
    .withMessage("New password must contain a number"),
];

// ── Routes ───────────────────────────────────────────────────────────

// Register
router.post("/register", validate(registerRules), async (req, res, next) => {
  try {
    const result = await AuthService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// Login
router.post("/login", validate(loginRules), async (req, res, next) => {
  try {
    const result = await AuthService.login(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Get profile (authenticated)
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const user = await AuthService.getProfile(req.user.id);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// Update profile (authenticated)
router.put(
  "/profile",
  authenticate,
  validate(profileRules),
  async (req, res, next) => {
    try {
      const user = await AuthService.updateProfile(req.user.id, req.body);
      res.json(user);
    } catch (err) {
      next(err);
    }
  }
);

// Change password (authenticated)
router.put(
  "/password",
  authenticate,
  validate(passwordRules),
  async (req, res, next) => {
    try {
      await AuthService.changePassword(req.user.id, req.body);
      res.json({ message: "Password changed successfully" });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
