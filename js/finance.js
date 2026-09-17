/* finance.js — Income & Expense Tracking Module */
const Finance = (() => {
  const EXPENSE_CATEGORIES = ["Raw materials", "Rent", "Utilities", "Salaries", "Maintenance", "Other"];
  let allTransactions = [];

  async function load() {
    allTransactions = await DB.getAll("transactions");
    allTransactions.sort((a, b) => b.date - a.date);
    return allTransactions;
  }

  function getAll() {
    return allTransactions;
  }

  async function addManual(type, category, amount, note, dateMs) {
    if (!(amount > 0)) throw new Error("Enter a valid amount greater than 0.");
    const record = {
      id: DB.uid(),
      type, // 'income' | 'expense'
      category: category || "Other",
      amount,
      note: note || "",
      date: dateMs || Date.now(),
      source: "manual",
    };
    await DB.put("transactions", record);
    await load();
    return record;
  }

  async function remove(id) {
    await DB.delete("transactions", id);
    await load();
  }

  // range: 'day' | 'week' | 'month' | 'custom'
  function rangeToBounds(range, refDate = new Date(), customStart, customEnd) {
    const start = new Date(refDate);
    const end = new Date(refDate);
    if (range === "day") {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (range === "week") {
      const day = start.getDay();
      const diffToMonday = (day + 6) % 7;
      start.setDate(start.getDate() - diffToMonday);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    } else if (range === "month") {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(start.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
    } else if (range === "custom") {
      return { start: customStart, end: customEnd };
    }
    return { start: start.getTime(), end: end.getTime() };
  }

  function filterByRange(range, refDate, customStart, customEnd) {
    const { start, end } = rangeToBounds(range, refDate, customStart, customEnd);
    return allTransactions.filter((t) => t.date >= start && t.date <= end);
  }

  function summarize(transactions) {
    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  }

  function byCategory(transactions, type) {
    const map = {};
    transactions
      .filter((t) => t.type === type)
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return map;
  }

  return {
    EXPENSE_CATEGORIES,
    load,
    getAll,
    addManual,
    remove,
    rangeToBounds,
    filterByRange,
    summarize,
    byCategory,
  };
})();
