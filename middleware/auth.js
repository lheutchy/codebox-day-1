const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const match = /^Bearer\s+(\S+)$/i.exec(req.get("Authorization") || "");
  if (!match) {
    return res.status(401).json({ error: "Missing or invalid token" });
  }

  if (!process.env.JWT_SECRET) {
    return next(new Error("JWT_SECRET is missing"));
  }

  try {
    req.auth = jwt.verify(match[1], process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    return next();
  } catch {
    return res.status(401).json({ error: "Missing or invalid token" });
  }
}

module.exports = { requireAuth };
