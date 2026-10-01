const jwt = require("jsonwebtoken");
const { findAccountById } = require("../services/accountService");

const COOKIE_NAME = "recipe_session";
const SESSION_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" || process.env.VERCEL === "1",
    path: "/",
  };
}

function setSession(res, account) {
  const token = jwt.sign({ sub: account.id, type: "session" }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "7d",
  });
  res.cookie(COOKIE_NAME, token, { ...cookieOptions(), maxAge: SESSION_AGE_MS });
}

function clearSession(res) {
  res.clearCookie(COOKIE_NAME, cookieOptions());
}

async function requireSession(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return res.status(401).json({ error: "Please sign in." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    if (payload.type !== "session") return res.status(401).json({ error: "Please sign in." });
    const account = await findAccountById(payload.sub);
    if (!account) return res.status(401).json({ error: "Please sign in." });
    req.account = account;
    return next();
  } catch (error) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Please sign in." });
    }
    return next(error);
  }
}

module.exports = { setSession, clearSession, requireSession };
