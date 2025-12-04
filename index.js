import "dotenv/config";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { setCookie, getCookie } from "hono/cookie";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "./db/index.js";
import { users, transactions } from "./db/schema.js";
import { eq, desc, sql } from "drizzle-orm";
import { serveStatic } from "@hono/node-server/serve-static";

const app = new Hono();
const SECRET = process.env.JWT_SECRET;

app.post("/api/register", async (c) => {
  try {
    const { username, password } = await c.req.json();
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await db
      .insert(users)
      .values({ username, password: hashedPassword })
      .returning({ id: users.id, username: users.username });
    return c.json({ success: true, data: newUser[0] }, 200);
  } catch (error) {
    return c.json({ success: false, message : "register gagal" }, 400);
  }
});

app.post("/api/login", async (c) => {
  const { username, password } = await c.req.json();
  const user = await db.query.users.findFirst({
    where: eq(users.username, username),
  });

  if (!user)
    return c.json({ success: false, message: "username atau password salah" });

  const isPasswordValid = await bcrypt.compare(password, user.password);
  const token = jwt.sign({ id: user.id, username: user.username }, SECRET, {
    expiresIn: "1d",
  });
  setCookie(c, "token", token, {
    httpOnly: false,
    sameSite: "Lax",
    maxAge: 86400,
  });

  return c.json({ success: true, message: "login berhasil" });
});

app.post("/api/logout", (c) => {
  setCookie(c, "token", "", { maxAge: -1 });
  return c.json({ success: true, message: "logout berhasil" });
});

app.get("/api/me", (c) => {
  const token = getCookie(c, "token");
  if (!token) return c.json({ success: false, message: "Unauthorized" }, 401);

  try {
    const user = jwt.verify(token, SECRET);
    return c.json({ success: true, data: user });
  } catch (error) {
    return c.json({ success: false, message: "token tidak valid" }, 404);
  }
});

const authMiddleware = async (c, next) => {
  const token = getCookie(c, "token");
  if (!token) return c.json({ success: false, message: "Unauthorized" });
  try {
    const user = jwt.verify(token, SECRET);
    c.set("user", user);
    await next();
  } catch (error) {
    return c.json({ success: false, message: "token gagal" });
  }
};

app.post("/api/transactions", authMiddleware, async (c) => {
  try {
    const user = c.get("user");
    const { nominal, transactionsDate, status, description } =
      await c.req.json();

    const newTransaction = await db
      .insert(transactions)
      .values({
        userId: user.id,
        nominal: Number(nominal),
        transactionDate: new Date(transactionsDate),
        status: status,
        description: description,
      })
      .returning();

    return c.json(
      {
        success: true,
        data: newTransaction[0]
      },
      201
    );
  } catch (error) {
    console.error(error);
    return c.json({ success: false, message: "gagal total" }, 404);
  }
});

app.get("/api/transactions", authMiddleware, async (c) => {
  try {
    const user = c.get("user");

    const { year, month } = c.req.query();

    if (!year || !month) {
      return c.json(
        { success: false, message: "Tahun dan bulan wajib diisi" },
        400
      );
    }

    // Start dan end bulan
    const startOfMonth = new Date(
      `${year}-${month.padStart(2, "0")}-01T00:00:00Z`
    );
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const userTransactions = await db.query.transactions.findMany({
      where: (t, { eq, and, gte, lt }) =>
        and(
          eq(t.userId, user.id),
          gte(t.transactionDate, startOfMonth),
          lt(t.transactionDate, endOfMonth)
        ),
      orderBy: (t, { desc }) => desc(t.transactionDate),
    });

    const totalIncome = userTransactions
      .filter((t) => t.status === "income")
      .reduce((sum, t) => sum + Number(t.nominal), 0);

    const totalOutcome = userTransactions
      .filter((t) => t.status === "outcome")
      .reduce((sum, t) => sum + Number(t.nominal), 0);

    const balance = totalIncome - totalOutcome;

    return c.json({
      success: true,
      data: userTransactions,
      summary: { totalIncome, totalOutcome, balance },
    });
  } catch (error) {
    console.error("error", error);
    return c.json({ success: false, message: error.message }, 500);
  }
});

// app.use("/*", serveStatic({ root: "./public" }));

app.get('/favicon.ico', (c) => {
  return c.text('No favicon', 404);
  // atau return favicon jika ada
});

// API Routes Anda
app.get('/', (c) => c.text('Hello World'));
app.get('/api/*', (c) => c.json({ status: 'ok' }));


if (process.env.VERCEL) {
  globalThis.app = app;
} else {
  const port = 8000;
  console.log(`🚀 Server is running on http://localhost:${port}`);
  serve({ fetch: app.fetch, port });
}
// const port = 8000;
// console.log(`server is running on http://localhost:${port}`);
// serve({ fetch: app.fetch, port });

export default app;