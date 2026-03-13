// ── Admin Service ────────────────────────────────────────────────────
// User management, role assignment — admin-only operations

const bcrypt = require("bcryptjs");
const { User, Role } = require("../models");
const { Op } = require("sequelize");

const SALT_ROUNDS = 12;

class AdminService {
  // List all users with pagination and optional role filter
  static async listUsers({ page = 1, limit = 20, role, search }) {
    const where = {};

    if (role) {
      const roleRecord = await Role.findOne({ where: { name: role } });
      if (roleRecord) where.role_id = roleRecord.id;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await User.findAndCountAll({
      where,
      include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
      attributes: { exclude: ["password_hash"] },
      order: [["created_at", "DESC"]],
      limit,
      offset,
    });

    return {
      users: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }

  // Create a new user with any role (admin can create scrutiny/mom members)
  static async createUser({ name, email, password, phone, organization, roleName }) {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      const err = new Error("Email already registered");
      err.status = 409;
      throw err;
    }

    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) {
      const err = new Error(`Role '${roleName}' not found`);
      err.status = 400;
      throw err;
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

    await user.reload({
      include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
    });

    const json = user.toJSON();
    delete json.password_hash;
    return json;
  }

  // Update a user's role
  static async assignRole(userId, roleName) {
    const user = await User.findByPk(userId);
    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }

    const role = await Role.findOne({ where: { name: roleName } });
    if (!role) {
      const err = new Error(`Role '${roleName}' not found`);
      err.status = 400;
      throw err;
    }

    user.role_id = role.id;
    await user.save();
    await user.reload({
      include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
      attributes: { exclude: ["password_hash"] },
    });

    return user;
  }

  // Activate or deactivate a user
  static async toggleActive(userId, isActive) {
    const user = await User.findByPk(userId);
    if (!user) {
      const err = new Error("User not found");
      err.status = 404;
      throw err;
    }

    user.is_active = isActive;
    await user.save();

    const json = user.toJSON();
    delete json.password_hash;
    return json;
  }

  // Get all roles (for role-assignment dropdowns)
  static async listRoles() {
    return Role.findAll({ order: [["id", "ASC"]] });
  }
}

module.exports = AdminService;
