const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "local-test-secret-that-is-not-used-in-production";
const app = require("../server");

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test("website and Day 2 sample routes respond", async () => {
  const home = await fetch(`${baseUrl}/`);
  assert.equal(home.status, 200);
  assert.match(await home.text(), /Recipe Box/);

  const hello = await fetch(`${baseUrl}/api/hello`);
  assert.equal(hello.status, 200);
  assert.equal(await hello.text(), "Hello from CodeBox!");

  const all = await fetch(`${baseUrl}/api/users`);
  assert.equal(all.status, 200);
  assert.deepEqual(await all.json(), [
    { id: 1, name: "Alex" },
    { id: 2, name: "Sam" },
  ]);

  const one = await fetch(`${baseUrl}/api/users/1`);
  assert.equal(one.status, 200);
  assert.deepEqual(await one.json(), { id: 1, name: "Alex" });

  const missing = await fetch(`${baseUrl}/api/users/999`);
  assert.equal(missing.status, 404);
  assert.deepEqual(await missing.json(), { error: "User not found" });
});

test("recipe routes require a signed-in account", async () => {
  const response = await fetch(`${baseUrl}/api/recipes`);
  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { error: "Please sign in." });
});

test("protected route accepts only a valid, unexpired HS256 token", async () => {
  const missing = await fetch(`${baseUrl}/api/me`);
  assert.equal(missing.status, 401);

  const validToken = jwt.sign({ sub: "1" }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "15m",
  });
  const valid = await fetch(`${baseUrl}/api/me`, {
    headers: { Authorization: `Bearer ${validToken}` },
  });
  assert.equal(valid.status, 200);
  assert.deepEqual(await valid.json(), { id: 1, name: "Alex" });

  const tamperedToken = `${validToken}x`;
  const tampered = await fetch(`${baseUrl}/api/me`, {
    headers: { Authorization: `Bearer ${tamperedToken}` },
  });
  assert.equal(tampered.status, 401);

  const expiredToken = jwt.sign({ sub: "1" }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: -1,
  });
  const expired = await fetch(`${baseUrl}/api/me`, {
    headers: { Authorization: `Bearer ${expiredToken}` },
  });
  assert.equal(expired.status, 401);

  const wrongAlgorithmToken = jwt.sign({ sub: "1" }, process.env.JWT_SECRET, {
    algorithm: "HS384",
    expiresIn: "15m",
  });
  const wrongAlgorithm = await fetch(`${baseUrl}/api/me`, {
    headers: { Authorization: `Bearer ${wrongAlgorithmToken}` },
  });
  assert.equal(wrongAlgorithm.status, 401);
});
