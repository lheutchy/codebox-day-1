const express = require("express");
const { requireSession } = require("../middleware/sessionAuth");
const {
  validateRecipe,
  listRecipes,
  findRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} = require("../services/recipeService");

const router = express.Router();
router.use(requireSession);

router.get("/", async (req, res) => {
  res.json({ recipes: await listRecipes(req.account.id) });
});

router.post("/", async (req, res) => {
  const data = validateRecipe(req.body);
  if (data.error) return res.status(400).json({ error: data.error });
  const recipe = await createRecipe(req.account.id, data);
  return res.status(201).json({ recipe });
});

router.get("/:id", async (req, res) => {
  const recipe = await findRecipe(req.account.id, req.params.id);
  if (!recipe) return res.status(404).json({ error: "Recipe not found." });
  return res.json({ recipe });
});

router.put("/:id", async (req, res) => {
  const data = validateRecipe(req.body);
  if (data.error) return res.status(400).json({ error: data.error });
  const recipe = await updateRecipe(req.account.id, req.params.id, data);
  if (!recipe) return res.status(404).json({ error: "Recipe not found." });
  return res.json({ recipe });
});

router.delete("/:id", async (req, res) => {
  const deleted = await deleteRecipe(req.account.id, req.params.id);
  if (!deleted) return res.status(404).json({ error: "Recipe not found." });
  return res.status(204).end();
});

module.exports = router;
