require("dotenv").config({ quiet: true });

const path = require("node:path");
const express = require("express");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const userRoutes = require("./routes/users");
const authRoutes = require("./routes/auth");
const recipeRoutes = require("./routes/recipes");
const { requireAuth } = require("./middleware/auth");
const { getUserById } = require("./services/userService");

const app = express();
app.use(helmet());
app.use(express.json({ limit: "64kb" }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/hello", (req, res) => {
  res.send("Hello from CodeBox!");
});

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);

app.get("/api/me", requireAuth, (req, res) => {
  const user = getUserById(req.auth.sub);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json(user);
});

app.use("/api", (req, res) => {
  res.status(404).json({ error: "Route not found." });
});

app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({ error: "Invalid JSON body." });
  }
  console.error("Request failed:", error.name, error.code || "");
  return res.status(500).json({ error: "Something went wrong. Please try again." });
});

if (require.main === module) {
  if (!process.env.JWT_SECRET) {
    console.error("JWT_SECRET is missing. Set it in a local .env file.");
    process.exit(1);
  }
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is missing. Set it in a local .env file.");
    process.exit(1);
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
  });
}

module.exports = app;
