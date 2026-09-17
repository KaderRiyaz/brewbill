/* billing.js — Billing & Calculation Module */
const Billing = (() => {
  let currentOrder = []; // [{ lineId, productId, name, variant, price, qty }]
  let discount = { type: "percent", value: 0 }; // type: 'percent' | 'fixed'
  let lastReceipt = null;

  function addItem(product, variant) {
    const existing = currentOrder.find((i) => i.productId === product.id && i.variant === variant.name);
    if (existing) {
      existing.qty += 1;
    } else {
      currentOrder.push({
        lineId: DB.uid(),
        productId: product.id,
        name: product.name,
        variant: variant.name,
        price: variant.price,
        qty: 1,
      });
    }
  }

  function changeQty(lineId, delta) {
    const item = currentOrder.find((i) => i.lineId === lineId);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) currentOrder = currentOrder.filter((i) => i.lineId !== lineId);
  }

  function removeItem(lineId) {
    currentOrder = currentOrder.filter((i) => i.lineId !== lineId);
  }

  function setDiscount(type, value) {
    discount = { type, value: isNaN(value) ? 0 : Math.max(0, value) };
  }

  function clearOrder() {
    currentOrder = [];
    discount = { type: "percent", value: 0 };
  }

  function getOrder() {
    return currentOrder;
  }

  function computeTotals(taxRate) {
    const subtotal = currentOrder.reduce((sum, i) => sum + i.price * i.qty, 0);
    let discountAmt = 0;
    if (discount.type === "percent") {
      discountAmt = (subtotal * discount.value) / 100;
    } else {
      discountAmt = Math.min(discount.value, subtotal);
    }
    const taxableBase = Math.max(0, subtotal - discountAmt);
    const taxAmt = (taxableBase * taxRate) / 100;
    const total = taxableBase + taxAmt;
    return { subtotal, discountAmt, taxAmt, total, taxRate };
  }

  async function checkout(taxRate, shopName, currency) {
    if (!currentOrder.length) throw new Error("Add at least one item before checking out.");
    const totals = computeTotals(taxRate);
    const now = Date.now();
    const order = {
      id: DB.uid(),
      items: currentOrder.map((i) => ({ ...i })),
      subtotal: totals.subtotal,
      discount: totals.discountAmt,
      discountType: discount.type,
      discountValue: discount.value,
      tax: totals.taxAmt,
      taxRate,
      total: totals.total,
      createdAt: now,
    };
    await DB.put("orders", order);

    const transaction = {
      id: DB.uid(),
      type: "income",
      category: "Sales",
      amount: totals.total,
      note: `Order #${order.id.slice(-6).toUpperCase()} — ${order.items.length} item(s)`,
      date: now,
      source: "order",
      orderId: order.id,
    };
    await DB.put("transactions", transaction);

    lastReceipt = { order, shopName, currency };
    clearOrder();
    return lastReceipt;
  }

  function getLastReceipt() {
    return lastReceipt;
  }

  return {
    addItem,
    changeQty,
    removeItem,
    setDiscount,
    clearOrder,
    getOrder,
    computeTotals,
    checkout,
    getLastReceipt,
    get discount() {
      return discount;
    },
  };
})();
