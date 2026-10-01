const express = require("express");
const {
  validateCredentials,
  createAccount,
  authenticateAccount,
} = require("../services/accountService");
const { setSession, clearSession, requireSession } = require("../middleware/sessionAuth");

const router = express.Router();

router.post("/register", async (req, res) => {
  const credentials = validateCredentials(req.body);
  if (credentials.error) return res.status(400).json({ error: credentials.error });

  try {
    const account = await createAccount(credentials.email, credentials.password);
    setSession(res, account);
    return res.status(201).json({ user: account });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "An account with that email already exists." });
    }
    throw error;
  }
});

router.post("/login", async (req, res) => {
  const credentials = validateCredentials(req.body);
  if (credentials.error) return res.status(400).json({ error: credentials.error });

  const account = await authenticateAccount(credentials.email, credentials.password);
  if (!account) return res.status(401).json({ error: "Email or password is incorrect." });
  setSession(res, account);
  return res.json({ user: account });
});

router.post("/logout", (req, res) => {
  clearSession(res);
  res.status(204).end();
});

router.get("/me", requireSession, (req, res) => {
  res.json({ user: req.account });
});

module.exports = router;
