// ── Role-Based Access Control Middleware ──────────────────────────────
// Usage: authorize("admin", "scrutiny_team")
// Checks req.user.role.name against the allowed list

function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = req.user.role?.name;
    if (!userRole || !allowedRoles.includes(userRole)) {
      return res.status(403).json({
        error: "Access denied",
        message: `Role '${userRole}' is not authorized for this resource`,
      });
    }

    next();
  };
}

module.exports = authorize;
