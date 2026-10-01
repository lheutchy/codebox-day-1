require("dotenv").config({ quiet: true });

const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const app = require("../server");
const { getDatabase, closeDatabase } = require("../db/database");
const { ObjectId } = require("mongodb");

async function main() {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const emailA = `recipe-smoke-${randomUUID()}@example.invalid`;
  const emailB = `recipe-smoke-${randomUUID()}@example.invalid`;
  const password = randomUUID();
  const accountIds = [];

  async function call(path, { method = "GET", cookie, body } = {}) {
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = response.status === 204 ? null : await response.json();
    return { response, data, cookie: response.headers.get("set-cookie")?.split(";")[0] };
  }

  try {
    const a = await call("/api/auth/register", { method: "POST", body: { email: emailA, password } });
    assert.equal(a.response.status, 201);
    accountIds.push(new ObjectId(a.data.user.id));
    assert.ok(a.cookie);

    const invalid = await call("/api/recipes", { method: "POST", cookie: a.cookie, body: { title: "Soup" } });
    assert.equal(invalid.response.status, 400);

    const created = await call("/api/recipes", {
      method: "POST",
      cookie: a.cookie,
      body: { title: "Tomato soup", ingredients: ["tomatoes", "salt"], instructions: "Simmer." },
    });
    assert.equal(created.response.status, 201);
    const recipeId = created.data.recipe.id;

    const list = await call("/api/recipes", { cookie: a.cookie });
    assert.equal(list.response.status, 200);
    assert.ok(list.data.recipes.some((recipe) => recipe.id === recipeId));

    const b = await call("/api/auth/register", { method: "POST", body: { email: emailB, password } });
    assert.equal(b.response.status, 201);
    accountIds.push(new ObjectId(b.data.user.id));
    assert.equal((await call(`/api/recipes/${recipeId}`, { cookie: b.cookie })).response.status, 404);
    assert.equal((await call(`/api/recipes/${recipeId}`, {
      method: "PUT", cookie: b.cookie,
      body: { title: "Changed", ingredients: ["salt"], instructions: "Mix." },
    })).response.status, 404);
    assert.equal((await call(`/api/recipes/${recipeId}`, { method: "DELETE", cookie: b.cookie })).response.status, 404);

    const updated = await call(`/api/recipes/${recipeId}`, {
      method: "PUT", cookie: a.cookie,
      body: { title: "Tomato and basil soup", ingredients: ["tomatoes", "basil"], instructions: "Simmer." },
    });
    assert.equal(updated.response.status, 200);
    assert.equal(updated.data.recipe.title, "Tomato and basil soup");

    const deleted = await call(`/api/recipes/${recipeId}`, { method: "DELETE", cookie: a.cookie });
    assert.equal(deleted.response.status, 204);
    assert.equal((await call(`/api/recipes/${recipeId}`, { cookie: a.cookie })).response.status, 404);

    const login = await call("/api/auth/login", { method: "POST", body: { email: emailA, password } });
    assert.equal(login.response.status, 200);
    assert.equal(login.data.user.email, emailA);

    console.log("MongoDB smoke test passed: account sign-in, recipe CRUD, and owner isolation.");
  } finally {
    try {
      if (accountIds.length) {
        const database = await getDatabase();
        await database.collection("recipes").deleteMany({ ownerId: { $in: accountIds } });
        await database.collection("accounts").deleteMany({ _id: { $in: accountIds } });
      }
    } finally {
      await closeDatabase();
      await new Promise((resolve) => server.close(resolve));
    }
  }
}

main().catch((error) => {
  console.error("Smoke test failed:", error.name, error.code || "");
  process.exitCode = 1;
});
