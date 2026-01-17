import { transactions } from "../db/schema.js";
import { db } from "../db/index.js";

const addTransaction = async (c) => {
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
    }

export default addTransaction;