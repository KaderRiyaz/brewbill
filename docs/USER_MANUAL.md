# BrewBill User Manual

BrewBill has four tabs, reached from the left sidebar on desktop or the bottom tab bar on
mobile: **Billing**, **Products**, **Finance**, and **Settings**.

## 1. Set up your shop first

Open **Settings** and fill in:
- **Shop name** — printed on receipts and shown at the top of the app.
- **Currency symbol** — e.g. `₹`, `$`, `€`.
- **Tax rate (%)** — applied automatically to every new order (you can still see the exact tax
  amount on each order before checkout).

Tap **Save settings**.

## 2. Add your products

Go to **Products** → **+ Add product**.

1. Enter a **product name** (e.g. "Cappuccino") and choose a **category**.
2. Add a **description** if you want one — optional.
3. Under **Sizes / variants & price**, enter at least one size name and its price. For a
   single-price item (like a muffin), just leave it as "Regular" with one price. For a drink
   with sizes, tap **+ Add size** to add Small/Medium/Large (or whatever names you use) each
   with its own price.
4. Tap **Save product**.

To change a product later, tap the pencil (✎) on its card in the Products list. To remove one,
tap the ✕ — you'll be asked to confirm, since this can't be undone.

Use the **search box** and **category dropdown** above the product list to find something
quickly once your menu grows.

## 3. Take a customer's order (Billing tab)

1. Tap a product tile to add it to the current order.
   - If it has only one size, it's added straight away.
   - If it has multiple sizes, a picker pops up — tap the size the customer wants.
2. Adjust quantity with the **−** / **+** buttons next to each line in the order panel (right
   side on desktop, or tap the **🛒 cart button** on mobile to open it).
3. To remove a line entirely, tap the ✕ next to it, or bring its quantity down to zero.
4. If a discount applies, choose **%** or **Amount** and enter the value — the total updates
   live.
5. Check the breakdown: **Subtotal**, **Discount**, **Tax**, and **Total**.
6. Tap **Checkout**. A receipt appears — tap **Print** to print it for the customer, or
   **Start new order** to close it and begin the next sale.
7. Every completed sale is automatically added to your income records in the **Finance** tab —
   you don't need to enter it again.
8. **Clear** empties the current order without completing a sale (useful if a customer changes
   their mind).

## 4. Record income and expenses (Finance tab)

Sales from Billing land here automatically as **Income → Sales**. Use the **Add entry** form
for anything else:

1. Choose **Income** or **Expense**.
2. Pick a **category** — for expenses: Raw materials, Rent, Utilities, Salaries, Maintenance,
   or Other. For income (outside of sales): "Other income".
3. Enter the **amount**, the **date**, and an optional **note** (e.g. "Milk supplier invoice").
4. Tap **Save entry**.

### Reports

Use the **Today / This week / This month** switch to see:
- **Income**, **Expenses**, and **Net** (profit or loss) for that period.
- A list of every transaction in the period. Manually entered transactions can be deleted with
  the ✕ button; sales that came from Billing are marked **auto** and stay linked to their order.

## 5. Back up your data (Settings tab)

BrewBill stores everything on this device only — there's no cloud sync. Back up regularly:

- **Export full backup (JSON)** — one file with everything (products, orders, transactions,
  settings). This is the file to use if you ever need to restore or move to a new device.
- **Export products / orders / transactions (CSV)** — spreadsheet-friendly exports for
  reporting or importing into other tools (Excel, Google Sheets, accounting software).
- **Restore backup** — choose a previously exported JSON file to load its data back in. This
  adds/updates records by ID and never deletes anything else already on the device.

## Tips

- BrewBill works with **no internet connection** once it's installed — perfect for a counter
  with unreliable Wi-Fi.
- Install it to your home screen or desktop (see the README/BUILD_DEPLOY guide) so it opens
  full-screen like a normal app, instead of running inside a browser tab.
- On a phone or tablet at the till, the **Billing** tab is the default screen every time you
  open the app.
