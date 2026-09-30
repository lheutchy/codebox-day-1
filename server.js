require("dotenv").config({ quiet: true });

const express = require("express");
const userRoutes = require("./routes/users");
const { requireAuth } = require("./middleware/auth");
const { getUserById } = require("./services/userService");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello from CodeBox!");
});

app.use("/api/users", userRoutes);

app.get("/api/me", requireAuth, (req, res) => {
  const user = getUserById(req.auth.sub);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json(user);
});

if (require.main === module) {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing. Set it in a local .env file.");
    process.exit(1);
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}

module.exports = app;
