// ── JWT Authentication Middleware ─────────────────────────────────────
// Verifies the Bearer token and attaches the user to req.user

const jwt = require("jsonwebtoken");
const config = require("../config");
const { User, Role } = require("../models");

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    let token;
    if (header && header.startsWith("Bearer ")) {
      token = header.split(" ")[1];
    } else if (req.query.token) {
      token = req.query.token;
    } else {
      return res.status(401).json({ error: "Authentication required" });
    }
    const decoded = jwt.verify(token, config.jwt.secret);

    // Fetch full user with role (token only stores id + role name)
    const user = await User.findByPk(decoded.id, {
      include: [{ model: Role, as: "role", attributes: ["id", "name"] }],
      attributes: { exclude: ["password_hash"] },
    });

    if (!user || !user.is_active) {
      return res.status(401).json({ error: "User not found or deactivated" });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    next(err);
  }
}

module.exports = authenticate;
