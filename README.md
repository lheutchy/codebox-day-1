# Recipe Box

A personal recipe collection built for CodeBox Bootcamp Day 3. Create an account, save recipes, search by title or ingredient, and edit or delete your own recipes. Accounts and recipes persist in MongoDB Atlas. The earlier Day 1 script and Day 2 API examples remain in the repo.

## Run locally

1. Install Node.js 20.19 or newer and run `npm install`.
2. Copy `.env.example` to `.env`.
3. Set `MONGODB_URI` to your Atlas connection string. Include the database user's credentials and allow your current IP address in Atlas Network Access.
4. Set `JWT_SECRET` to a long random value. You can generate one locally with `node -e 'console.log(require("node:crypto").randomBytes(48).toString("hex"))'`.
5. Keep `MONGODB_DB=codebox_recipe_box` or choose a database name.
6. Run `npm run dev` and open <http://localhost:3000/>.

Use **Create account** on the site, then add a recipe. Enter one ingredient per line. Your account's recipes remain after a reload or server restart. `.env` is ignored by Git; never commit connection strings or JWT secrets.

## Check it

- `npm test` checks the Day 2 API, unauthenticated access, and input validation without changing Atlas data.
- `npm run smoke` creates disposable accounts and a recipe in Atlas, checks sign-in, CRUD, and cross-account isolation, then removes the test data.
- In the browser, create an account; add, find, open, edit, and delete a recipe; reload to confirm persistence; sign out and back in.

## App API

The browser uses an HTTP-only session cookie. JSON errors have an `error` field.

| Method and path | Purpose |
| --- | --- |
| `POST /api/auth/register` | Create an account with `email` and `password` |
| `POST /api/auth/login` | Sign in |
| `POST /api/auth/logout` | Sign out |
| `GET /api/auth/me` | Get the signed-in account |
| `GET /api/recipes` | List your recipes |
| `POST /api/recipes` | Add a recipe |
| `GET /api/recipes/:id` | Read one of your recipes |
| `PUT /api/recipes/:id` | Update one of your recipes |
| `DELETE /api/recipes/:id` | Delete one of your recipes |

A recipe request uses `title` (1–120 characters), `ingredients` (1–50 nonempty strings), `instructions` (1–5000 characters), and optional `notes` (up to 1000 characters). Recipe lookups include the account ID so another account cannot read or change them. Passwords are hashed with bcrypt. The older demo routes remain at `/api/hello`, `/api/users`, and `/api/me`; `npm run token` is only for the Day 2 sample route.

## Deploy to Vercel

Import this GitHub repository into Vercel as a Node.js project. The exported Express app in `server.js` and static files in `public/` are the entry points. Add `MONGODB_URI`, `MONGODB_DB`, and a new production `JWT_SECRET` in Vercel Project Settings → Environment Variables, then deploy. Ensure Atlas Network Access permits connections from the deployment environment. Do not upload `.env` or paste its values into GitHub.

The local app and database are working. A public Vercel deployment is a separate step and should be checked after configuration: load the site, create an account, save a recipe, and reload.

## Day 3 workflow

The review found that recipe access must be scoped to the signed-in account and that wrong-type optional fields should be rejected. `AGENTS.md` records those API rules; the notes validation and its test apply them. `npm test`, the Atlas smoke test, and a browser walkthrough cover the review and testing exercise. The MCP exercise is documented in `DAY3-MCP.md`.
