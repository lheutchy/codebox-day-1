require("dotenv").config({ quiet: true });

const jwt = require("jsonwebtoken");

if (!process.env.JWT_SECRET) {
  console.error("JWT_SECRET is missing. Set it in a local .env file.");
  process.exit(1);
}

const token = jwt.sign({ sub: "1" }, process.env.JWT_SECRET, {
  algorithm: "HS256",
  expiresIn: "15m",
});

console.log(token);
