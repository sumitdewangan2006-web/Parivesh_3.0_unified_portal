// ── File Upload Middleware ────────────────────────────────────────────
// Multer config with file type + size validation

const multer = require("multer");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const config = require("../config");

// Storage: rename files with UUID to prevent path traversal / collisions
const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, config.upload.dir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

// Filter: only allow configured MIME types
function fileFilter(_req, file, cb) {
  if (config.upload.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `File type '${file.mimetype}' is not allowed. Accepted: PDF, DOC, DOCX, JPEG, PNG`
      ),
      false
    );
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSizeMB * 1024 * 1024,
  },
});

module.exports = upload;
