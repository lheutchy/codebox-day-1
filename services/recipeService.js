const { ObjectId } = require("mongodb");
const { getDatabase } = require("../db/database");

function validateRecipe(input) {
  const title = typeof input?.title === "string" ? input.title.trim() : "";
  const instructions = typeof input?.instructions === "string" ? input.instructions.trim() : "";
  const notes = typeof input?.notes === "string" ? input.notes.trim() : "";
  const ingredients = input?.ingredients;

  if (!title || title.length > 120) return { error: "Title must be 1 to 120 characters." };
  if (!Array.isArray(ingredients) || ingredients.length < 1 || ingredients.length > 50) {
    return { error: "Add 1 to 50 ingredients." };
  }
  if (ingredients.some((item) => typeof item !== "string" || !item.trim() || item.trim().length > 200)) {
    return { error: "Each ingredient must be 1 to 200 characters." };
  }
  if (!instructions || instructions.length > 5000) {
    return { error: "Instructions must be 1 to 5000 characters." };
  }
  if (input?.notes !== undefined && typeof input.notes !== "string") {
    return { error: "Notes must be text." };
  }
  if (notes.length > 1000) return { error: "Notes must be at most 1000 characters." };

  return { title, ingredients: ingredients.map((item) => item.trim()), instructions, notes };
}

function recipeId(id) {
  return /^[a-f\d]{24}$/i.test(id || "") ? new ObjectId(id) : null;
}

function publicRecipe(recipe) {
  return {
    id: recipe._id.toString(),
    title: recipe.title,
    ingredients: recipe.ingredients,
    instructions: recipe.instructions,
    notes: recipe.notes,
    createdAt: recipe.createdAt,
    updatedAt: recipe.updatedAt,
  };
}

async function recipes() {
  const database = await getDatabase();
  return database.collection("recipes");
}

async function listRecipes(ownerId) {
  const collection = await recipes();
  const rows = await collection.find({ ownerId: new ObjectId(ownerId) }).sort({ updatedAt: -1 }).toArray();
  return rows.map(publicRecipe);
}

async function findRecipe(ownerId, id) {
  const _id = recipeId(id);
  if (!_id) return null;
  const collection = await recipes();
  const row = await collection.findOne({ _id, ownerId: new ObjectId(ownerId) });
  return row ? publicRecipe(row) : null;
}

async function createRecipe(ownerId, data) {
  const collection = await recipes();
  const now = new Date();
  const row = { ...data, ownerId: new ObjectId(ownerId), createdAt: now, updatedAt: now };
  const result = await collection.insertOne(row);
  return publicRecipe({ ...row, _id: result.insertedId });
}

async function updateRecipe(ownerId, id, data) {
  const _id = recipeId(id);
  if (!_id) return null;
  const collection = await recipes();
  const row = await collection.findOneAndUpdate(
    { _id, ownerId: new ObjectId(ownerId) },
    { $set: { ...data, updatedAt: new Date() } },
    { returnDocument: "after" },
  );
  return row ? publicRecipe(row) : null;
}

async function deleteRecipe(ownerId, id) {
  const _id = recipeId(id);
  if (!_id) return false;
  const collection = await recipes();
  const result = await collection.deleteOne({ _id, ownerId: new ObjectId(ownerId) });
  return result.deletedCount === 1;
}

module.exports = {
  validateRecipe,
  listRecipes,
  findRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
};
