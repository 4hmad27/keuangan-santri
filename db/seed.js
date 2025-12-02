import "dotenv/config";
import { db } from "./index.js";
import bcrypt from "bcryptjs";
import { transactions, users } from "./schema.js";

async function seed() {
  console.log("sedding database");

  const password = "123";
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await db
    .insert(users)
    .values({ username: "ahmad", password: hashedPassword })
    .returning();
  console.log(user[0]);

  await db.insert(transactions).values([
    {
      nominal: 500000.0,
      transactionDate: "2025-10-01",
      status: "income",
      description: "gaji bulan ini",
      userId: user[0].id,
    },
    {
      nominal: 30000.0,
      transactionDate: "2025-10-02",
      status: "outcome",
      description: "nongkrong",
      userId: user[0].id,
    },
  ]);

  console.log("seeding complate");
  process.exit(0);
}

seed().catch((err) => {
  console.error("sedding error", err), process.exit(1);
});
