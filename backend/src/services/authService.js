// ── Auth Service ─────────────────────────────────────────────────────
// Business logic for registration, login, token generation, profile

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config");
const { User, Role } = require("../models");

const SALT_ROUNDS = 12;

class AuthService {
  // Generate a signed JWT for the given user
  static generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role?.name || null },
      config.jwt.secret,
      { expiresIn: config.jwt.expiry }
    );
  }

  // Register a new project proponent / RQP
  static async register({ name, email, password, phone, organization }) {
    // Check for existing user
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      const err = new Error("Email already registered");
      err.status = 409;
      throw err;
    }

    // Default role: project_proponent (id = 2)
    const role = await Role.findOne({ where: { name: "project_proponent" } });
    if (!role) {
      throw new Error("Default role not configured");
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      name,
      email,
      password_hash,
      phone: phone || null,
      organization: organization || null,
      role_id: role.id,
    });

    // Reload with role association
    await user.reload({
      include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
    });

    const token = AuthService.generateToken(user);

    return {
      token,
      user: AuthService.sanitize(user),
    };
  }

  // Login with email + password
  static async login({ email, password }) {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
    });

    if (!user) {
      const err = new Error("Invalid email or password");
      err.status = 401;
      throw err;
    }

    if (!user.is_active) {
      const err = new Error("Account is deactivated");
      err.status = 403;
      throw err;
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const err = new Error("Invalid email or password");
      err.status = 401;
      throw err;
    }

    const token = AuthService.generateToken(user);

    return {
      token,
      user: AuthService.sanitize(user),
    };
  }

  // Get current user profile
  static async getProfile(userId) {
    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
      attributes: { exclude: ["password_hash"] },
    });

    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }

    return user;
  }

  // Update profile (name, phone, organization)
  static async updateProfile(userId, data) {
    const user = await User.findByPk(userId);
    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }

    const allowedFields = ["name", "phone", "organization"];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        user[field] = data[field];
      }
    }

    await user.save();
    await user.reload({
      include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
      attributes: { exclude: ["password_hash"] },
    });

    return AuthService.sanitize(user);
  }

  // Change password
  static async changePassword(userId, { currentPassword, newPassword }) {
    const user = await User.findByPk(userId);
    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      const err = new Error("Current password is incorrect");
      err.status = 400;
      throw err;
    }

    user.password_hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();
  }

  // Strip sensitive fields from user object
  static sanitize(user) {
    const json = user.toJSON();
    delete json.password_hash;
    return json;
  }
}

module.exports = AuthService;
