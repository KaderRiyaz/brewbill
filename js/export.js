/* export.js — Data Backup, Export & Import */
const DataIO = (() => {
  async function exportAllJSON() {
    const [products, orders, transactions, settings] = await Promise.all([
      DB.getAll("products"),
      DB.getAll("orders"),
      DB.getAll("transactions"),
      DB.getSettings(),
    ]);
    const payload = {
      app: "BrewBill",
      exportedAt: new Date().toISOString(),
      version: 1,
      products,
      orders,
      transactions,
      settings,
    };
    downloadFile(`brewbill-backup-${dateStamp()}.json`, JSON.stringify(payload, null, 2), "application/json");
  }

  async function importJSON(file) {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data || typeof data !== "object") throw new Error("This file doesn't look like a BrewBill backup.");
    if (Array.isArray(data.products)) await DB.bulkPut("products", data.products);
    if (Array.isArray(data.orders)) await DB.bulkPut("orders", data.orders);
    if (Array.isArray(data.transactions)) await DB.bulkPut("transactions", data.transactions);
    if (data.settings) await DB.saveSettings(data.settings);
    return {
      products: data.products?.length || 0,
      orders: data.orders?.length || 0,
      transactions: data.transactions?.length || 0,
    };
  }

  async function exportProductsCSV() {
    const products = await DB.getAll("products");
    const rows = [["id", "name", "category", "description", "variant_name", "variant_price"]];
    products.forEach((p) => {
      p.variants.forEach((v) => {
        rows.push([p.id, p.name, p.category, p.description || "", v.name, v.price]);
      });
    });
    downloadFile(`brewbill-products-${dateStamp()}.csv`, toCSV(rows), "text/csv");
  }

  async function exportTransactionsCSV() {
    const transactions = await DB.getAll("transactions");
    const rows = [["id", "type", "category", "amount", "note", "date", "source"]];
    transactions
      .sort((a, b) => a.date - b.date)
      .forEach((t) => {
        rows.push([t.id, t.type, t.category, t.amount, t.note || "", new Date(t.date).toISOString(), t.source]);
      });
    downloadFile(`brewbill-transactions-${dateStamp()}.csv`, toCSV(rows), "text/csv");
  }

  async function exportOrdersCSV() {
    const orders = await DB.getAll("orders");
    const rows = [["order_id", "date", "item_name", "variant", "price", "qty", "line_total", "subtotal", "discount", "tax", "total"]];
    orders
      .sort((a, b) => a.createdAt - b.createdAt)
      .forEach((o) => {
        o.items.forEach((i) => {
          rows.push([
            o.id,
            new Date(o.createdAt).toISOString(),
            i.name,
            i.variant,
            i.price,
            i.qty,
            (i.price * i.qty).toFixed(2),
            o.subtotal.toFixed(2),
            o.discount.toFixed(2),
            o.tax.toFixed(2),
            o.total.toFixed(2),
          ]);
        });
      });
    downloadFile(`brewbill-orders-${dateStamp()}.csv`, toCSV(rows), "text/csv");
  }

  function toCSV(rows) {
    return rows
      .map((r) =>
        r
          .map((cell) => {
            const s = String(cell ?? "");
            return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
          })
          .join(",")
      )
      .join("\n");
  }

  function downloadFile(filename, content, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }

  function dateStamp() {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(
      d.getHours()
    ).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
  }

  return { exportAllJSON, importJSON, exportProductsCSV, exportTransactionsCSV, exportOrdersCSV };
})();
