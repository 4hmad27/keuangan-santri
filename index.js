import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
// import { setCookie, getCookie } from "hono/cookie";
// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";
// import { db } from "./db/index.js";
// import { users, transactions } from "./db/schema.js";
// import { eq, desc, sql } from "drizzle-orm";
import { serveStatic } from "@hono/node-server/serve-static";
import { registerRouter } from "./API/register.js";
import { loginRouter } from "./API/login.js";
import { logoutRouter } from "./API/logout.js";
import { checkAuth } from "./API/index.js";
import { authMiddleware } from "./API/auth.js";
import  addTransaction  from "./API/addTransaction.js";
import  getTransaction  from "./API/getTransaction.js";
import  getAllTransaction  from "./API/getAllTransaction.js";

const app = new Hono();
const SECRET = process.env.JWT_SECRET;

registerRouter(app);
loginRouter(app);
logoutRouter(app);
checkAuth(app);
// app.use("/api/transactions/*", authMiddleware);
app.post("/api/transactions", authMiddleware, addTransaction)
app.get("/api/transactions", authMiddleware, getTransaction)
app.get("/api/trasactions/all", authMiddleware, getAllTransaction)


app.use("/*", serveStatic({ root: "./public" }));

// app.get('/favicon.ico', (c) => {
//   return c.text('No favicon', 404);
//   // atau return favicon jika ada
// });

// // API Routes Anda
// app.get('/', (c) => c.text('Hello World'));
// app.get('/api/*', (c) => c.json({ status: 'ok' }));


// if (process.env.VERCEL) {
//   globalThis.app = app;
// } else {
//   const port = 8000;
//   console.log(`🚀 Server is running on http://localhost:${port}`);
//   serve({ fetch: app.fetch, port });
// }
const port = 8000;
console.log(`server is running on http://localhost:${port}`);
serve({ fetch: app.fetch, port });

export default {app, authMiddleware};