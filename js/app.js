/* app.js — App shell: navigation, rendering, event wiring */
const App = (() => {
  let settings = { id: "app", taxRate: 5, shopName: "My Coffee Shop", currency: "₹" };
  let pendingVariantProduct = null;

  function fmtMoney(n) {
    const v = Number(n || 0);
    return `${settings.currency}${v.toFixed(2)}`;
  }

  function toast(msg, isError = false) {
    const el = document.querySelector("[data-toast]");
    el.textContent = msg;
    el.classList.toggle("error", isError);
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function confirmAction({ title, message, confirmLabel = "Confirm" }) {
    const backdrop = document.querySelector("[data-confirm-modal]");
    const dialog = backdrop.querySelector(".confirm-modal");
    const acceptButton = backdrop.querySelector("[data-confirm-accept]");
    const cancelButton = backdrop.querySelector("[data-confirm-cancel]");
    const closeButton = backdrop.querySelector("[data-confirm-close]");
    const previousFocus = document.activeElement;

    backdrop.querySelector("[data-confirm-title]").textContent = title;
    backdrop.querySelector("[data-confirm-message]").textContent = message;
    acceptButton.textContent = confirmLabel;
    backdrop.classList.add("show");

    return new Promise((resolve) => {
      let settled = false;
      const finish = (confirmed) => {
        if (settled) return;
        settled = true;
        backdrop.classList.remove("show");
        backdrop.removeEventListener("click", handleBackdropClick);
        document.removeEventListener("keydown", handleKeydown);
        acceptButton.removeEventListener("click", accept);
        cancelButton.removeEventListener("click", cancel);
        closeButton.removeEventListener("click", cancel);
        if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
        resolve(confirmed);
      };
      const accept = () => finish(true);
      const cancel = () => finish(false);
      const handleBackdropClick = (event) => {
        if (event.target === backdrop) cancel();
      };
      const handleKeydown = (event) => {
        if (event.key === "Escape") cancel();
      };

      acceptButton.addEventListener("click", accept);
      cancelButton.addEventListener("click", cancel);
      closeButton.addEventListener("click", cancel);
      backdrop.addEventListener("click", handleBackdropClick);
      document.addEventListener("keydown", handleKeydown);
      dialog.querySelector("[data-confirm-accept]").focus();
    });
  }

  // ---------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------
  function setupNav() {
    const buttons = document.querySelectorAll("[data-tab]");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => switchTab(btn.dataset.tab));
    });
  }

  function switchTab(tab) {
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.toggle("active", p.dataset.panel === tab));
    document.querySelectorAll("[data-tab]").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    if (tab === "finance") renderFinanceReport();
  }

  // ---------------------------------------------------------------
  // Billing tab
  // ---------------------------------------------------------------
  function renderBillingCatalog() {
    const search = document.querySelector("[data-billing-search]").value;
    const category = document.querySelector("[data-billing-category]").value;
    const container = document.querySelector("[data-billing-products]");
    const list = Products.filtered(search, category);
    container.innerHTML = "";
    if (!list.length) {
      container.innerHTML = `<div class="empty-state">No products found.</div>`;
      return;
    }
    list.forEach((p) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "product-tile";
      const priceLabel =
        p.variants.length === 1
          ? fmtMoney(p.variants[0].price)
          : `${fmtMoney(Math.min(...p.variants.map((v) => v.price)))}+`;
      card.innerHTML = `
        <span class="tag">${p.category}</span>
        <span class="product-tile-name">${p.name}</span>
        <span class="product-tile-price">${priceLabel}</span>
      `;
      card.addEventListener("click", () => handleProductTap(p));
      container.appendChild(card);
    });
  }

  function handleProductTap(product) {
    if (product.variants.length === 1) {
      Billing.addItem(product, product.variants[0]);
      renderOrder();
      toast(`Added ${product.name}`);
    } else {
      openVariantPicker(product);
    }
  }

  function openVariantPicker(product) {
    pendingVariantProduct = product;
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop show";
    backdrop.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true">
        <div class="modal-header"><h2>${product.name}</h2><button class="icon-btn" data-close>✕</button></div>
        <div class="variant-picker">
          ${product.variants
            .map(
              (v, idx) =>
                `<button class="variant-pick-btn" data-idx="${idx}"><span>${v.name}</span><span>${fmtMoney(v.price)}</span></button>`
            )
            .join("")}
        </div>
      </div>
    `;
    document.body.appendChild(backdrop);
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop || e.target.closest("[data-close]")) backdrop.remove();
    });
    backdrop.querySelectorAll(".variant-pick-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const variant = product.variants[Number(btn.dataset.idx)];
        Billing.addItem(product, variant);
        renderOrder();
        toast(`Added ${product.name} (${variant.name})`);
        backdrop.remove();
      });
    });
  }

  function renderOrder() {
    const order = Billing.getOrder();
    const linesEl = document.querySelector("[data-order-lines]");
    linesEl.innerHTML = "";
    if (!order.length) {
      linesEl.innerHTML = `<div class="empty-state">No items yet. Tap a product to add it.</div>`;
    } else {
      order.forEach((item) => {
        const row = document.createElement("div");
        row.className = "order-line";
        row.innerHTML = `
          <div class="order-line-info">
            <span class="order-line-name">${item.name}</span>
            <span class="order-line-variant">${item.variant} · ${fmtMoney(item.price)}</span>
          </div>
          <div class="qty-stepper">
            <button data-qty-minus>−</button>
            <span>${item.qty}</span>
            <button data-qty-plus>+</button>
          </div>
          <span class="order-line-total">${fmtMoney(item.price * item.qty)}</span>
          <button class="icon-btn danger" data-remove-line>✕</button>
        `;
        row.querySelector("[data-qty-minus]").addEventListener("click", () => {
          Billing.changeQty(item.lineId, -1);
          renderOrder();
        });
        row.querySelector("[data-qty-plus]").addEventListener("click", () => {
          Billing.changeQty(item.lineId, 1);
          renderOrder();
        });
        row.querySelector("[data-remove-line]").addEventListener("click", () => {
          Billing.removeItem(item.lineId);
          renderOrder();
        });
        linesEl.appendChild(row);
      });
    }
    const count = order.reduce((s, i) => s + i.qty, 0);
    document.querySelector("[data-cart-count]").textContent = count;
    renderTotals();
  }

  function renderTotals() {
    const type = document.querySelector("[data-discount-type]").value;
    const value = parseFloat(document.querySelector("[data-discount-value]").value) || 0;
    Billing.setDiscount(type, value);
    const totals = Billing.computeTotals(settings.taxRate);
    document.querySelector("[data-total-subtotal]").textContent = fmtMoney(totals.subtotal);
    document.querySelector("[data-total-discount]").textContent = `-${fmtMoney(totals.discountAmt)}`;
    document.querySelector("[data-total-tax]").textContent = fmtMoney(totals.taxAmt);
    document.querySelector("[data-tax-label]").textContent = `Tax (${settings.taxRate}%)`;
    document.querySelector("[data-total-grand]").textContent = fmtMoney(totals.total);
  }

  async function handleCheckout() {
    try {
      const receipt = await Billing.checkout(settings.taxRate, settings.shopName, settings.currency);
      await Finance.load();
      renderOrder();
      document.querySelector("[data-discount-value]").value = 0;
      showReceipt(receipt);
    } catch (err) {
      toast(err.message, true);
    }
  }

  function showReceipt({ order, shopName, currency }) {
    const body = document.querySelector("[data-receipt-body]");
    const dt = new Date(order.createdAt);
    body.innerHTML = `
      <div class="receipt-shop">${shopName}</div>
      <div class="receipt-meta">${dt.toLocaleString()} · Order #${order.id.slice(-6).toUpperCase()}</div>
      <div class="receipt-items">
        ${order.items
          .map(
            (i) => `
          <div class="receipt-item">
            <span>${i.qty} × ${i.name} (${i.variant})</span>
            <span>${currency}${(i.price * i.qty).toFixed(2)}</span>
          </div>`
          )
          .join("")}
      </div>
      <div class="receipt-totals">
        <div><span>Subtotal</span><span>${currency}${order.subtotal.toFixed(2)}</span></div>
        <div><span>Discount</span><span>-${currency}${order.discount.toFixed(2)}</span></div>
        <div><span>Tax (${order.taxRate}%)</span><span>${currency}${order.tax.toFixed(2)}</span></div>
        <div class="grand"><span>Total</span><span>${currency}${order.total.toFixed(2)}</span></div>
      </div>
      <div class="receipt-thanks">Thank you — see you again soon!</div>
    `;
    document.querySelector("[data-receipt-modal]").classList.add("show");
  }

  // ---------------------------------------------------------------
  // Products tab
  // ---------------------------------------------------------------
  function renderProductsTab() {
    const search = document.querySelector("[data-product-search]").value;
    const category = document.querySelector("[data-product-category]").value;
    Products.renderList(
      document.querySelector("[data-product-list]"),
      search,
      category,
      openEditProduct,
      confirmDeleteProduct,
      (p) => {
        switchTab("billing");
        handleProductTap(p);
      }
    );
  }

  function openAddProduct() {
    const form = document.querySelector("[data-product-form]");
    Products.resetForm(form);
    document.querySelector("[data-product-modal]").classList.add("show");
  }

  function openEditProduct(product) {
    const form = document.querySelector("[data-product-form]");
    Products.loadIntoForm(form, product);
    document.querySelector("[data-product-modal]").classList.add("show");
  }

  function closeProductForm() {
    document.querySelector("[data-product-modal]").classList.remove("show");
  }

  async function confirmDeleteProduct(product) {
    const confirmed = await confirmAction({
      title: "Delete product?",
      message: `Delete "${product.name}"? This can't be undone.`,
      confirmLabel: "Delete product",
    });
    if (!confirmed) return;
    await Products.remove(product.id);
    renderProductsTab();
    renderBillingCatalog();
    toast("Product deleted");
  }

  // ---------------------------------------------------------------
  // Finance tab
  // ---------------------------------------------------------------
  let entryType = "income";
  let activeRange = "day";

  function renderFinanceCategoryOptions() {
    const sel = document.querySelector("[data-finance-category]");
    sel.innerHTML = "";
    const cats = entryType === "income" ? ["Sales", "Other income"] : Finance.EXPENSE_CATEGORIES;
    cats.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      sel.appendChild(opt);
    });
  }

  function renderFinanceReport() {
    const txns = Finance.filterByRange(activeRange, new Date());
    const summary = Finance.summarize(txns);
    const resetButton = document.querySelector("[data-reset-period]");
    const reportTitle = document.querySelector("[data-report-title]");
    const periodLabel = activeRange === "week" ? "This Week" : activeRange === "month" ? "This Month" : "Today";
    resetButton.hidden = false;
    resetButton.textContent = `Reset ${periodLabel.toLowerCase()}`;
    resetButton.title = `Remove all income and expenses from ${periodLabel.toLowerCase()}`;
    reportTitle.textContent = `${periodLabel} Entries`;
    document.querySelector("[data-report-income]").textContent = fmtMoney(summary.income);
    document.querySelector("[data-report-expense]").textContent = fmtMoney(summary.expense);
    document.querySelector("[data-report-net]").textContent = fmtMoney(summary.net);

    const listEl = document.querySelector("[data-transaction-list]");
    listEl.innerHTML = "";
    if (!txns.length) {
      listEl.innerHTML = `<div class="empty-state">No transactions in this range.</div>`;
      return;
    }
    txns
      .sort((a, b) => b.date - a.date)
      .forEach((t) => {
        const row = document.createElement("div");
        row.className = `transaction-row ${t.type}`;
        row.innerHTML = `
          <div class="transaction-main">
            <span class="transaction-category">${t.category}</span>
            <span class="transaction-note">${t.note || ""}</span>
          </div>
          <span class="transaction-date">${new Date(t.date).toLocaleDateString()}</span>
          <span class="transaction-amount">${t.type === "expense" ? "-" : "+"}${fmtMoney(t.amount)}</span>
          <button class="icon-btn danger" data-del-txn="${t.id}" title="Delete ${t.type}" aria-label="Delete ${t.type}">✕</button>
        `;
        listEl.appendChild(row);
      });
    listEl.querySelectorAll("[data-del-txn]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await Finance.remove(btn.dataset.delTxn);
        renderFinanceReport();
        toast("Entry removed");
      });
    });
  }

  async function resetFinancePeriod() {
    const label = activeRange === "day" ? "today" : activeRange === "week" ? "this week" : "this month";
    const confirmed = await confirmAction({
      title: `Reset ${label}?`,
      message: `This will permanently delete all income and expense entries in ${label}.`,
      confirmLabel: `Reset ${label}`,
    });
    if (!confirmed) return;
    const removed = await Finance.resetPeriod(activeRange);
    renderFinanceReport();
    toast(removed ? `${removed} entr${removed === 1 ? "y" : "ies"} removed` : `No entries found for ${label}`);
  }

  async function handleFinanceSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const category = form.category.value;
    const amount = parseFloat(form.amount.value);
    const note = form.note.value.trim();
    const dateVal = form.date.value ? new Date(form.date.value).getTime() : Date.now();
    try {
      await Finance.addManual(entryType, category, amount, note, dateVal);
      form.reset();
      setDefaultDate(form);
      renderFinanceCategoryOptions();
      renderFinanceReport();
      toast("Entry saved");
    } catch (err) {
      toast(err.message, true);
    }
  }

  function setDefaultDate(form) {
    const today = new Date();
    form.date.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  }

  // ---------------------------------------------------------------
  // Settings tab
  // ---------------------------------------------------------------
  function loadSettingsForm() {
    const form = document.querySelector("[data-settings-form]");
    form.shopName.value = settings.shopName;
    form.currency.value = settings.currency;
    form.taxRate.value = settings.taxRate;
    document.querySelector("[data-shop-name]").textContent = settings.shopName;
  }

  async function handleSettingsSubmit(e) {
    e.preventDefault();
    const form = e.target;
    settings = {
      ...settings,
      shopName: form.shopName.value.trim() || "My Coffee Shop",
      currency: form.currency.value.trim() || "₹",
      taxRate: parseFloat(form.taxRate.value) || 0,
    };
    await DB.saveSettings(settings);
    document.querySelector("[data-shop-name]").textContent = settings.shopName;
    renderBillingCatalog();
    renderOrder();
    toast("Settings saved");
  }

  // ---------------------------------------------------------------
  // Wiring
  // ---------------------------------------------------------------
  function wireEvents() {
    setupNav();

    // Billing
    document.querySelector("[data-billing-search]").addEventListener("input", renderBillingCatalog);
    document.querySelector("[data-billing-category]").addEventListener("change", renderBillingCatalog);
    document.querySelector("[data-discount-type]").addEventListener("change", renderTotals);
    document.querySelector("[data-discount-value]").addEventListener("input", renderTotals);
    document.querySelector("[data-checkout]").addEventListener("click", handleCheckout);
    document.querySelector("[data-clear-order]").addEventListener("click", () => {
      if (Billing.getOrder().length && !confirm("Clear the current order?")) return;
      Billing.clearOrder();
      document.querySelector("[data-discount-value]").value = 0;
      renderOrder();
    });

    // Mobile cart drawer
    const orderPanel = document.querySelector("[data-order-panel]");
    const drawerBackdrop = document.querySelector("[data-mobile-cart-drawer]");
    const closeMobileOrder = () => {
      orderPanel.classList.remove("show-mobile");
      drawerBackdrop.classList.remove("show");
    };
    const toggleMobileOrder = () => {
      const isOpen = orderPanel.classList.toggle("show-mobile");
      drawerBackdrop.classList.toggle("show", isOpen);
    };
    document.querySelector("[data-mobile-cart-toggle]").addEventListener("click", () => {
      toggleMobileOrder();
    });
    document.querySelector("[data-close-order]").addEventListener("click", closeMobileOrder);
    drawerBackdrop.addEventListener("click", closeMobileOrder);

    // Receipt
    document.querySelector("[data-close-receipt]").addEventListener("click", () => {
      document.querySelector("[data-receipt-modal]").classList.remove("show");
    });
    document.querySelector("[data-new-order]").addEventListener("click", () => {
      document.querySelector("[data-receipt-modal]").classList.remove("show");
    });
    document.querySelector("[data-print-receipt]").addEventListener("click", () => window.print());

    // Products
    document.querySelector("[data-open-product-form]").addEventListener("click", openAddProduct);
    document.querySelectorAll("[data-close-product-form]").forEach((b) => b.addEventListener("click", closeProductForm));
    document.querySelector("[data-product-modal]").addEventListener("click", (e) => {
      if (e.target === document.querySelector("[data-product-modal]")) closeProductForm();
    });
    document.querySelector("[data-add-variant]").addEventListener("click", () => {
      Products.addVariantRow(document.querySelector("[data-product-form]"));
    });
    document.querySelector("[data-product-form]").addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        await Products.submitForm(e.target);
        closeProductForm();
        renderProductsTab();
        renderBillingCatalog();
        toast("Product saved");
      } catch (err) {
        toast(err.message, true);
      }
    });
    document.querySelector("[data-product-search]").addEventListener("input", renderProductsTab);
    document.querySelector("[data-product-category]").addEventListener("change", renderProductsTab);

    // Finance
    document.querySelectorAll("[data-entry-type] .seg").forEach((btn) => {
      btn.addEventListener("click", () => {
        entryType = btn.dataset.type;
        document.querySelectorAll("[data-entry-type] .seg").forEach((b) => b.classList.toggle("active", b === btn));
        renderFinanceCategoryOptions();
      });
    });
    document.querySelectorAll("[data-range-select] .seg").forEach((btn) => {
      btn.addEventListener("click", () => {
        activeRange = btn.dataset.range;
        document.querySelectorAll("[data-range-select] .seg").forEach((b) => b.classList.toggle("active", b === btn));
        renderFinanceReport();
      });
    });
    document.querySelector("[data-reset-period]").addEventListener("click", resetFinancePeriod);
    document.querySelector("[data-finance-form]").addEventListener("submit", handleFinanceSubmit);

    // Settings
    document.querySelector("[data-settings-form]").addEventListener("submit", handleSettingsSubmit);
    document.querySelector("[data-export-json]").addEventListener("click", () => DataIO.exportAllJSON());
    document.querySelector("[data-export-products-csv]").addEventListener("click", () => DataIO.exportProductsCSV());
    document.querySelector("[data-export-orders-csv]").addEventListener("click", () => DataIO.exportOrdersCSV());
    document.querySelector("[data-export-transactions-csv]").addEventListener("click", () => DataIO.exportTransactionsCSV());
    document.querySelector("[data-import-json]").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const result = await DataIO.importJSON(file);
        await refreshAll();
        toast(`Imported ${result.products} products, ${result.orders} orders, ${result.transactions} transactions`);
      } catch (err) {
        toast("Import failed: " + err.message, true);
      }
      e.target.value = "";
    });
  }

  async function refreshAll() {
    settings = await DB.getSettings();
    await Products.load();
    await Finance.load();
    loadSettingsForm();
    Products.renderCategoryOptions(document.querySelector("[data-billing-category]"));
    Products.renderCategoryOptions(document.querySelector("[data-product-category]"));
    Products.renderCategoryOptions(document.querySelector("[data-product-form-category]"), false);
    renderBillingCatalog();
    renderProductsTab();
    renderOrder();
    renderFinanceCategoryOptions();
    setDefaultDate(document.querySelector("[data-finance-form]"));
    renderFinanceReport();
  }

  async function init() {
    wireEvents();

    try {
      settings = await DB.getSettings();
      await DB.saveSettings(settings);
      await refreshAll();
    } catch (err) {
      console.error("BrewBill initialization failed", err);
      toast("Some data could not be loaded. You can still use the app.", true);
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./service-worker.js", { updateViaCache: "none" }).catch(() => {});
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  return { fmtMoney, toast };
})();
