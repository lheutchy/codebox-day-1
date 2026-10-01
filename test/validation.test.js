const { test } = require("node:test");
const assert = require("node:assert/strict");
const { validateCredentials } = require("../services/accountService");
const { validateRecipe } = require("../services/recipeService");

test("account input is normalized and rejects weak credentials", () => {
  assert.deepEqual(validateCredentials({ email: "  CHEF@example.com ", password: "eightchars" }), {
    email: "chef@example.com",
    password: "eightchars",
  });
  assert.ok(validateCredentials({ email: "invalid", password: "eightchars" }).error);
  assert.ok(validateCredentials({ email: "chef@example.com", password: "short" }).error);
});

test("recipe input accepts useful content and rejects malformed fields", () => {
  assert.deepEqual(validateRecipe({
    title: "  Tomato soup  ",
    ingredients: [" 2 tomatoes ", " salt "],
    instructions: " Simmer. ",
  }), {
    title: "Tomato soup",
    ingredients: ["2 tomatoes", "salt"],
    instructions: "Simmer.",
    notes: "",
  });
  assert.ok(validateRecipe({ title: "Soup", ingredients: [], instructions: "Simmer." }).error);
  assert.ok(validateRecipe({ title: "Soup", ingredients: ["salt"], instructions: "" }).error);
  assert.ok(validateRecipe({ title: "Soup", ingredients: [4], instructions: "Simmer." }).error);
  assert.equal(validateRecipe({ title: "Soup", ingredients: ["salt"], instructions: "Simmer.", notes: 4 }).error, "Notes must be text.");
});
