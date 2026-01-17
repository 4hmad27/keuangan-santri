import { db } from "../db/index.js";

const getAllTransaction = async (c) => {    
      const user = c.get("user");
      const userTransactions = await db.query.transactions.findMany({
        where: eq(transactions.userId, user.id),
        orderBy: desc(transactions.transactionDate),
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
    }

export default getAllTransaction;