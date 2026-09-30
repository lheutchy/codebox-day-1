# CodeBox Day 2: Express API

This project keeps the Day 1 script in `src/` and adds the Day 2 Node.js API exercises. The user data is temporary and resets whenever the server restarts. No frontend or database connection is needed for these exercises.

## Set up

1. Run `npm install`.
2. Copy `.env.example` to `.env`.
3. Replace `JWT_SECRET` in `.env` with a long, random secret. For example, run `node -e 'console.log(require("crypto").randomBytes(48).toString("hex"))'` locally and paste its output into `.env`.
4. Add your MongoDB Atlas connection string as `MONGODB_URI` in `.env` when you have one. The take home task asks for credentials, but this lesson's API still uses the in-memory sample users.
5. Run `npm run dev` and open <http://localhost:3000/>.

The local `.env` and `node_modules/` are ignored by Git. `.env.example` shows the required keys without real credentials. Run `git status` before pushing.

## Routes and curl checks

| Request | Expected result |
| --- | --- |
| `curl -i http://localhost:3000/` | 200, `Hello from CodeBox!` |
| `curl -i http://localhost:3000/api/users` | 200, JSON array with Alex and Sam |
| `curl -i http://localhost:3000/api/users/1` | 200, JSON for Alex |
| `curl -i http://localhost:3000/api/users/999` | 404, JSON error |
| `curl -i http://localhost:3000/api/me` | 401, JSON error |

To try the protected route, run `npm run token` and copy the resulting token. Then run:

```sh
curl -i http://localhost:3000/api/me -H 'Authorization: Bearer YOUR_TOKEN_HERE'
```

That request returns 200 with Alex's sample profile. A tampered or expired token returns 401. `npm run token` is a teaching shortcut: it creates a 15-minute token for sample user 1 without checking a password. It is not a login system. Never put the token or your secret in GitHub.

## How it works

`server.js` starts Express on port 3000 by default and registers the routes. `app.get` handles a GET request at a path; `req` contains request details; `res` sends a response; and `app.listen` starts accepting requests. `routes/users.js` handles user HTTP requests. The `:id` value is available as `req.params.id`. `services/userService.js` looks up users in the temporary array. `res.json` sends a JSON response. `middleware/auth.js` checks the JWT signature, algorithm, and expiration before `/api/me` returns a profile.

The request path for a user lookup is: client → `server.js` → `routes/users.js` → `services/userService.js` → JSON response. The frontend and database concepts in the slides are future steps; this project currently has no UI or persistent data.
