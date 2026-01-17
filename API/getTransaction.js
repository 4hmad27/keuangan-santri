import { db } from "../db/index.js"; 

const getTransaction = async (c) => {
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
    }

export default getTransaction;