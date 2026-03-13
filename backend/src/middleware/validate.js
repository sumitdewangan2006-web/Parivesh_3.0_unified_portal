// ── Input Validation Middleware ───────────────────────────────────────
// Wraps express-validator — call validate(rules) on any route

const { validationResult } = require("express-validator");

function validate(validations) {
  return async (req, res, next) => {
    // Run all validation chains
    await Promise.all(validations.map((v) => v.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    return res.status(422).json({
      error: "Validation failed",
      details: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  };
}

module.exports = validate;
