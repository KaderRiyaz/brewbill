/* products.js — Product Management Module */
const Products = (() => {
  let allProducts = [];
  let editingId = null;
  let variantDraft = [];

  const CATEGORY_LIST = ["Beverages", "Pastries", "Snacks", "Desserts", "Other"];

  async function load() {
    allProducts = await DB.getAll("products");
    allProducts.sort((a, b) => a.name.localeCompare(b.name));
    return allProducts;
  }

  function getAll() {
    return allProducts;
  }

  function filtered(searchTerm = "", category = "") {
    const term = searchTerm.trim().toLowerCase();
    return allProducts.filter((p) => {
      const matchesTerm = !term || p.name.toLowerCase().includes(term);
      const matchesCat = !category || p.category === category;
      return matchesTerm && matchesCat;
    });
  }

  function renderCategoryOptions(selectEl, includeAll = true) {
    selectEl.innerHTML = "";
    if (includeAll) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "All categories";
      selectEl.appendChild(opt);
    }
    CATEGORY_LIST.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      selectEl.appendChild(opt);
    });
  }

  function renderList(container, searchTerm, category, onEdit, onDelete, onQuickAdd) {
    const list = filtered(searchTerm, category);
    container.innerHTML = "";
    if (!list.length) {
      container.innerHTML = `<div class="empty-state">No products match. Try a different search, or add a new product.</div>`;
      return;
    }
    list.forEach((p) => {
      const card = document.createElement("div");
      card.className = "product-card";
      const priceLabel =
        p.variants.length === 1
          ? fmtMoney(p.variants[0].price)
          : `${fmtMoney(Math.min(...p.variants.map((v) => v.price)))}–${fmtMoney(
              Math.max(...p.variants.map((v) => v.price))
            )}`;
      card.innerHTML = `
        <div class="product-card-top">
          <span class="tag">${escapeHtml(p.category)}</span>
          <div class="product-card-actions">
            <button class="icon-btn" data-action="edit" title="Edit">✎</button>
            <button class="icon-btn danger" data-action="delete" title="Delete">✕</button>
          </div>
        </div>
        <div class="product-card-name">${escapeHtml(p.name)}</div>
        ${p.description ? `<div class="product-card-desc">${escapeHtml(p.description)}</div>` : ""}
        <div class="product-card-bottom">
          <span class="product-card-price">${priceLabel}</span>
          <button class="btn small" data-action="add">Add to order</button>
        </div>
      `;
      card.querySelector('[data-action="edit"]').addEventListener("click", () => onEdit(p));
      card.querySelector('[data-action="delete"]').addEventListener("click", () => onDelete(p));
      card.querySelector('[data-action="add"]').addEventListener("click", () => onQuickAdd(p));
      container.appendChild(card);
    });
  }

  // ---- Form handling ----
  function resetForm(formEl) {
    editingId = null;
    variantDraft = [{ name: "Regular", price: "" }];
    formEl.reset();
    renderVariantRows(formEl);
    formEl.querySelector("[data-form-title]").textContent = "Add product";
    formEl.querySelector("[data-submit-label]").textContent = "Save product";
  }

  function loadIntoForm(formEl, product) {
    editingId = product.id;
    variantDraft = product.variants.map((v) => ({ ...v, price: String(v.price) }));
    formEl.name.value = product.name;
    formEl.category.value = product.category;
    formEl.description.value = product.description || "";
    renderVariantRows(formEl);
    formEl.querySelector("[data-form-title]").textContent = "Edit product";
    formEl.querySelector("[data-submit-label]").textContent = "Update product";
  }

  function renderVariantRows(formEl) {
    const wrap = formEl.querySelector("[data-variant-rows]");
    wrap.innerHTML = "";
    variantDraft.forEach((v, idx) => {
      const row = document.createElement("div");
      row.className = "variant-row";
      row.innerHTML = `
        <input type="text" placeholder="Size / variant name" value="${escapeAttr(v.name)}" data-vname required />
        <input type="number" step="0.01" min="0" placeholder="Price" value="${escapeAttr(v.price)}" data-vprice required />
        <button type="button" class="icon-btn danger" data-remove-variant ${variantDraft.length <= 1 ? "disabled" : ""}>✕</button>
      `;
      row.querySelector("[data-vname]").addEventListener("input", (e) => (variantDraft[idx].name = e.target.value));
      row.querySelector("[data-vprice]").addEventListener("input", (e) => (variantDraft[idx].price = e.target.value));
      row.querySelector("[data-remove-variant]").addEventListener("click", () => {
        if (variantDraft.length <= 1) return;
        variantDraft.splice(idx, 1);
        renderVariantRows(formEl);
      });
      wrap.appendChild(row);
    });
  }

  function addVariantRow(formEl) {
    variantDraft.push({ name: "", price: "" });
    renderVariantRows(formEl);
  }

  async function submitForm(formEl) {
    const name = formEl.name.value.trim();
    const category = formEl.category.value;
    const description = formEl.description.value.trim();
    const variants = variantDraft
      .map((v) => ({ name: v.name.trim() || "Regular", price: parseFloat(v.price) }))
      .filter((v) => !isNaN(v.price) && v.price >= 0);

    if (!name) throw new Error("Product name is required.");
    if (!category) throw new Error("Please choose a category.");
    if (!variants.length) throw new Error("Add at least one size/variant with a valid price.");

    const now = Date.now();
    const record = {
      id: editingId || DB.uid(),
      name,
      category,
      description,
      variants,
      createdAt: editingId ? (allProducts.find((p) => p.id === editingId)?.createdAt ?? now) : now,
      updatedAt: now,
    };
    await DB.put("products", record);
    await load();
    return record;
  }

  async function remove(id) {
    await DB.delete("products", id);
    await load();
  }

  function fmtMoney(n) {
    return App.fmtMoney(n);
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function escapeAttr(s) {
    return escapeHtml(s);
  }

  return {
    CATEGORY_LIST,
    load,
    getAll,
    filtered,
    renderCategoryOptions,
    renderList,
    resetForm,
    loadIntoForm,
    addVariantRow,
    renderVariantRows,
    submitForm,
    remove,
    get editingId() {
      return editingId;
    },
  };
})();
