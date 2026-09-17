# Database Schema

BrewBill stores everything in the browser's **IndexedDB**, in a database named `brewbill`
(version 1), defined in `js/db.js`. There is no server and no network call for any of this
data — it lives entirely on the device.

## Store: `products`

One record per menu item. Key path: `id`.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique ID, generated client-side |
| `name` | string | Product name, e.g. "Cappuccino" |
| `category` | string | One of: Beverages, Pastries, Snacks, Desserts, Other |
| `description` | string | Optional |
| `variants` | array of `{ name: string, price: number }` | At least one variant always exists. A product with no real size options gets a single variant named "Regular" |
| `createdAt` | number (epoch ms) | |
| `updatedAt` | number (epoch ms) | |

Indexes: `category`, `name`.

```json
{
  "id": "m3k7f2ab",
  "name": "Cappuccino",
  "category": "Beverages",
  "description": "Espresso with steamed milk foam.",
  "variants": [
    { "name": "Small", "price": 120 },
    { "name": "Medium", "price": 150 },
    { "name": "Large", "price": 180 }
  ],
  "createdAt": 1758000000000,
  "updatedAt": 1758000000000
}
```

## Store: `orders`

One record per completed sale (created at checkout). Key path: `id`.

| Field | Type | Notes |
|---|---|---|
| `id` | string | Unique order ID |
| `items` | array of `{ productId, name, variant, price, qty }` | Snapshot of what was sold — changing a product later never rewrites past orders |
| `subtotal` | number | Sum of `price * qty` across items |
| `discount` | number | Discount amount actually applied, in currency |
| `discountType` | `"percent"` \| `"fixed"` | How the discount was entered |
| `discountValue` | number | The raw percentage or fixed amount entered |
| `tax` | number | Tax amount applied |
| `taxRate` | number | Tax percentage at the time of sale |
| `total` | number | Final amount charged |
| `createdAt` | number (epoch ms) | |

Index: `createdAt`.

## Store: `transactions`

Every income and expense entry — both auto-created from checkouts and manually entered.
Key path: `id`.

| Field | Type | Notes |
|---|---|---|
| `id` | string | |
| `type` | `"income"` \| `"expense"` | |
| `category` | string | Income: "Sales" (auto) or "Other income" (manual). Expense: Raw materials, Rent, Utilities, Salaries, Maintenance, Other |
| `amount` | number | |
| `note` | string | Optional free text |
| `date` | number (epoch ms) | |
| `source` | `"order"` \| `"manual"` | `"order"` entries are auto-created at checkout and cannot be deleted individually from the UI (delete the order data via a full restore instead) |
| `orderId` | string | Present only when `source` is `"order"` — links back to the `orders` store |

Indexes: `date`, `type`.

## Store: `settings`

A single record, key `"app"`.

| Field | Type | Notes |
|---|---|---|
| `id` | `"app"` | Fixed key |
| `shopName` | string | Shown on receipts and the top bar |
| `currency` | string | Symbol prefix, e.g. `₹`, `$`, `€` |
| `taxRate` | number | Default percentage applied to every new order |

## Backup file format (JSON export)

`Settings → Export full backup (JSON)` produces a single file shaped like:

```json
{
  "app": "BrewBill",
  "exportedAt": "2026-09-17T10:00:00.000Z",
  "version": 1,
  "products": [ /* array of product records */ ],
  "orders": [ /* array of order records */ ],
  "transactions": [ /* array of transaction records */ ],
  "settings": { /* settings record */ }
}
```

Importing this file (`Settings → Restore backup`) upserts every record by `id` — existing
records with the same ID are overwritten, new ones are added, and nothing already in the
database is deleted.
