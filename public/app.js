const $ = (id) => document.getElementById(id);

const state = {
  mode: "login",
  recipes: [],
  selected: null,
  editing: null,
};

async function api(path, options = {}) {
  const response = await fetch(path, {
    credentials: "same-origin",
    ...options,
    headers: options.body ? { "Content-Type": "application/json" } : {},
  });
  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || "Something went wrong. Please try again.");
    error.status = response.status;
    throw error;
  }
  return data;
}

function showError(element, message) {
  element.textContent = message;
  element.hidden = !message;
}

let toastTimer;
function toast(message) {
  const element = $("toast");
  element.textContent = message;
  element.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { element.hidden = true; }, 3500);
}

function showAuth(message = "") {
  $("auth-view").hidden = false;
  $("recipes-view").hidden = true;
  $("account-nav").hidden = true;
  showError($("auth-error"), message);
}

function showRecipes(user) {
  $("auth-view").hidden = true;
  $("recipes-view").hidden = false;
  $("account-nav").hidden = false;
  $("account-email").textContent = user.email;
  showError($("auth-error"), "");
}

function setAuthMode(mode) {
  state.mode = mode;
  const registering = mode === "register";
  $("auth-heading").textContent = registering ? "Create account" : "Sign in";
  $("auth-submit").firstChild.textContent = registering ? "Create account " : "Sign in ";
  $("auth-password").autocomplete = registering ? "new-password" : "current-password";
  $("login-tab").classList.toggle("is-active", !registering);
  $("register-tab").classList.toggle("is-active", registering);
  $("login-tab").setAttribute("aria-pressed", String(!registering));
  $("register-tab").setAttribute("aria-pressed", String(registering));
  $("auth-password").value = "";
  showError($("auth-error"), "");
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(value));
}

function makeCard(recipe) {
  const card = document.createElement("article");
  card.className = "recipe-card";
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", `View ${recipe.title}`);

  const topline = document.createElement("div");
  topline.className = "card-topline";
  const label = document.createElement("span");
  label.textContent = "RECIPE";
  const flower = document.createElement("span");
  flower.className = "card-flower";
  flower.textContent = "✳";
  flower.setAttribute("aria-hidden", "true");
  topline.append(label, flower);

  const title = document.createElement("h2");
  title.textContent = recipe.title;
  const preview = document.createElement("p");
  preview.textContent = recipe.instructions;
  const bottom = document.createElement("div");
  bottom.className = "card-bottom";
  const meta = document.createElement("span");
  meta.textContent = `${recipe.ingredients.length} ingredient${recipe.ingredients.length === 1 ? "" : "s"} · Updated ${formatDate(recipe.updatedAt)}`;
  const arrow = document.createElement("span");
  arrow.className = "card-arrow";
  arrow.textContent = "↗";
  arrow.setAttribute("aria-hidden", "true");
  bottom.append(meta, arrow);
  card.append(topline, title, preview, bottom);

  card.addEventListener("click", () => openDetail(recipe));
  card.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openDetail(recipe);
    }
  });
  return card;
}

function renderRecipes() {
  const query = $("recipe-search").value.trim().toLowerCase();
  const filtered = state.recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(query) ||
    recipe.ingredients.some((ingredient) => ingredient.toLowerCase().includes(query)),
  );
  const count = state.recipes.length;
  $("recipe-count").textContent = `${count} saved recipe${count === 1 ? "" : "s"}`;

  const grid = $("recipe-grid");
  grid.replaceChildren(...filtered.map(makeCard));
  grid.hidden = filtered.length === 0;

  const empty = $("empty-state");
  empty.hidden = filtered.length > 0;
  $("empty-heading").textContent = count === 0 ? "No recipes yet." : "No matches.";
  $("empty-description").textContent = count === 0
    ? "Add your first recipe."
    : "Try another name or ingredient.";
  $("empty-add-button").hidden = count > 0;
}

async function loadRecipes() {
  $("loading-state").hidden = false;
  $("recipe-grid").hidden = true;
  $("empty-state").hidden = true;
  showError($("list-error"), "");
  try {
    const data = await api("/api/recipes");
    state.recipes = data.recipes;
    renderRecipes();
  } catch (error) {
    if (error.status === 401) return showAuth("Your session ended. Please sign in again.");
    showError($("list-error"), error.message);
  } finally {
    $("loading-state").hidden = true;
  }
}

function openEditor(recipe = null) {
  state.editing = recipe;
  $("recipe-form").reset();
  $("recipe-dialog-title").textContent = recipe ? "Edit recipe" : "New recipe";
  $("save-recipe-button").textContent = recipe ? "Save changes" : "Save recipe";
  $("recipe-title").value = recipe?.title || "";
  $("recipe-ingredients").value = recipe?.ingredients.join("\n") || "";
  $("recipe-instructions").value = recipe?.instructions || "";
  $("recipe-notes").value = recipe?.notes || "";
  showError($("recipe-error"), "");
  $("recipe-dialog").showModal();
  $("recipe-title").focus();
}

function openDetail(recipe) {
  state.selected = recipe;
  $("detail-title").textContent = recipe.title;
  $("detail-ingredients").replaceChildren(...recipe.ingredients.map((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    return li;
  }));
  $("detail-instructions").textContent = recipe.instructions;
  $("detail-notes").textContent = recipe.notes;
  $("detail-notes-block").hidden = !recipe.notes;
  $("detail-dialog").showModal();
}

$("login-tab").addEventListener("click", () => setAuthMode("login"));
$("register-tab").addEventListener("click", () => setAuthMode("register"));

$("auth-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const button = $("auth-submit");
  button.disabled = true;
  showError($("auth-error"), "");
  try {
    const data = await api(`/api/auth/${state.mode}`, {
      method: "POST",
      body: JSON.stringify({
        email: $("auth-email").value,
        password: $("auth-password").value,
      }),
    });
    $("auth-form").reset();
    showRecipes(data.user);
    await loadRecipes();
  } catch (error) {
    showError($("auth-error"), error.message);
  } finally {
    button.disabled = false;
  }
});

$("logout-button").addEventListener("click", async () => {
  try {
    await api("/api/auth/logout", { method: "POST" });
    state.recipes = [];
    showAuth();
    toast("Signed out of your recipe box.");
  } catch (error) {
    toast(error.message);
  }
});

$("new-recipe-button").addEventListener("click", () => openEditor());
$("empty-add-button").addEventListener("click", () => openEditor());
$("recipe-search").addEventListener("input", renderRecipes);
$("close-recipe-dialog").addEventListener("click", () => $("recipe-dialog").close());
$("cancel-recipe-button").addEventListener("click", () => $("recipe-dialog").close());
$("close-detail-dialog").addEventListener("click", () => $("detail-dialog").close());

$("recipe-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!event.currentTarget.reportValidity()) return;
  const button = $("save-recipe-button");
  button.disabled = true;
  showError($("recipe-error"), "");
  const data = {
    title: $("recipe-title").value,
    ingredients: $("recipe-ingredients").value.split("\n").map((item) => item.trim()).filter(Boolean),
    instructions: $("recipe-instructions").value,
    notes: $("recipe-notes").value,
  };
  try {
    const editing = state.editing;
    await api(editing ? `/api/recipes/${editing.id}` : "/api/recipes", {
      method: editing ? "PUT" : "POST",
      body: JSON.stringify(data),
    });
    $("recipe-dialog").close();
    await loadRecipes();
    toast(editing ? "Recipe updated." : "Recipe saved to your box.");
  } catch (error) {
    if (error.status === 401) {
      $("recipe-dialog").close();
      showAuth("Your session ended. Please sign in again.");
    } else {
      showError($("recipe-error"), error.message);
    }
  } finally {
    button.disabled = false;
  }
});

$("edit-recipe-button").addEventListener("click", () => {
  const recipe = state.selected;
  $("detail-dialog").close();
  openEditor(recipe);
});
$("delete-recipe-button").addEventListener("click", () => {
  $("detail-dialog").close();
  showError($("delete-error"), "");
  $("delete-dialog").showModal();
});
$("cancel-delete-button").addEventListener("click", () => $("delete-dialog").close());
$("confirm-delete-button").addEventListener("click", async () => {
  const button = $("confirm-delete-button");
  button.disabled = true;
  showError($("delete-error"), "");
  try {
    await api(`/api/recipes/${state.selected.id}`, { method: "DELETE" });
    $("delete-dialog").close();
    await loadRecipes();
    toast("Recipe deleted.");
  } catch (error) {
    if (error.status === 401) {
      $("delete-dialog").close();
      showAuth("Your session ended. Please sign in again.");
    } else {
      showError($("delete-error"), error.message);
    }
  } finally {
    button.disabled = false;
  }
});

(async () => {
  try {
    const data = await api("/api/auth/me");
    showRecipes(data.user);
    await loadRecipes();
  } catch (error) {
    showAuth(error.status === 401 ? "" : "Could not reach the server. Please refresh the page.");
  }
})();
