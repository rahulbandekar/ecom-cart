import express from "express";
import cors from "cors";
import session from "express-session";
import { v4 as uuidv4 } from "uuid";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Middleware ────────────────────────────────────────────────────────────────

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://ecom-cart-ruby.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(
  session({
    secret: process.env.SESSION_SECRET || "vibe-commerce-dev-secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
    },
  })
);

// Attach a stable session cart ID to every request
app.use((req, _res, next) => {
  if (!req.session.cartId) {
    req.session.cartId = uuidv4();
  }
  next();
});

// ─── Database ─────────────────────────────────────────────────────────────────

const db = new sqlite3.Database(path.join(__dirname, "data.sqlite"));

const SEED_PRODUCTS = [
  {
    id: 1,
    name: "Wireless Headphones",
    price: 99.99,
    image: "",
    description: "High-quality wireless headphones with noise cancellation",
  },
  {
    id: 2,
    name: "Smart Watch",
    price: 149.99,
    image: "",
    description: "Modern smartwatch with fitness tracking",
  },
  {
    id: 3,
    name: "Bluetooth Speaker",
    price: 79.99,
    image: "",
    description: "Portable speaker with deep bass",
  },
  {
    id: 4,
    name: "Laptop Stand",
    price: 39.99,
    image: "",
    description: "Ergonomic aluminum laptop stand",
  },
  {
    id: 5,
    name: "USB-C Hub",
    price: 29.99,
    image: "",
    description: "Multi-port USB-C hub for laptops",
  },
];

// All DB setup is serialized — CREATE TABLE finishes before the seed check runs
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id          INTEGER PRIMARY KEY,
      name        TEXT    NOT NULL,
      price       REAL    NOT NULL,
      image       TEXT,
      description TEXT,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id         TEXT    PRIMARY KEY,
      cart_id    TEXT    NOT NULL,
      product_id INTEGER NOT NULL,
      quantity   INTEGER NOT NULL,
      added_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id)
    )
  `);

  // Seed only when table is empty — safely inside serialize so tables exist
  db.get("SELECT COUNT(*) AS count FROM products", (err, row) => {
    if (err) { console.error("Seed check failed:", err); return; }
    if (row.count > 0) return;

    const stmt = db.prepare(
      "INSERT INTO products (id, name, price, image, description) VALUES (?, ?, ?, ?, ?)"
    );
    SEED_PRODUCTS.forEach((p) =>
      stmt.run(p.id, p.name, p.price, p.image, p.description)
    );
    stmt.finalize(() => console.log("Products seeded."));
  });
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Run db.all and return a promise */
const dbAll = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.all(sql, params, (err, rows) => (err ? reject(err) : resolve(rows)))
  );

/** Run db.get and return a promise */
const dbGet = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.get(sql, params, (err, row) => (err ? reject(err) : resolve(row)))
  );

/** Run db.run and return a promise (resolves with `this` for changes/lastID) */
const dbRun = (sql, params = []) =>
  new Promise((resolve, reject) =>
    db.run(sql, params, function (err) {
      err ? reject(err) : resolve(this);
    })
  );

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/products
app.get("/api/products", async (_req, res) => {
  try {
    const rows = await dbAll("SELECT * FROM products");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cart
app.get("/api/cart", async (req, res) => {
  try {
    const rows = await dbAll(
      `SELECT ci.id, ci.product_id, ci.quantity,
              p.name, p.price, p.image,
              (ci.quantity * p.price) AS item_total
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = ?`,
      [req.session.cartId]
    );

    const total = rows.reduce((sum, r) => sum + r.item_total, 0);
    res.json({
      items: rows.map((r) => ({
        cartId: r.id,
        productId: r.product_id,
        name: r.name,
        price: r.price,
        image: r.image,
        quantity: r.quantity,
        itemTotal: parseFloat(r.item_total.toFixed(2)),
      })),
      total: parseFloat(total.toFixed(2)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cart
app.post("/api/cart", async (req, res) => {
  const productId = parseInt(req.body.productId, 10);
  const quantity = parseInt(req.body.quantity, 10);

  if (!Number.isInteger(productId) || productId < 1) {
    return res.status(400).json({ error: "productId must be a positive integer" });
  }
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: "quantity must be a positive integer" });
  }

  try {
    const product = await dbGet("SELECT id FROM products WHERE id = ?", [productId]);
    if (!product) return res.status(404).json({ error: "Product not found" });

    const existing = await dbGet(
      "SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?",
      [req.session.cartId, productId]
    );

    if (existing) {
      await dbRun(
        "UPDATE cart_items SET quantity = ? WHERE id = ?",
        [existing.quantity + quantity, existing.id]
      );
      return res.json({ message: "Cart updated", cartItemId: existing.id });
    }

    const cartItemId = uuidv4();
    await dbRun(
      "INSERT INTO cart_items (id, cart_id, product_id, quantity) VALUES (?, ?, ?, ?)",
      [cartItemId, req.session.cartId, productId, quantity]
    );
    res.json({ message: "Item added to cart", cartItemId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/cart/:id
app.delete("/api/cart/:id", async (req, res) => {
  try {
    const result = await dbRun(
      "DELETE FROM cart_items WHERE id = ? AND cart_id = ?",
      [req.params.id, req.session.cartId]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }
    res.json({ message: "Item removed from cart" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/cart/:id
app.put("/api/cart/:id", async (req, res) => {
  const quantity = parseInt(req.body.quantity, 10);
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: "quantity must be a positive integer" });
  }

  try {
    const result = await dbRun(
      "UPDATE cart_items SET quantity = ? WHERE id = ? AND cart_id = ?",
      [quantity, req.params.id, req.session.cartId]
    );
    if (result.changes === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }
    res.json({ message: "Cart item updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/checkout
app.post("/api/checkout", async (req, res) => {
  const { customerInfo, name, email } = req.body;
  const customer = customerInfo || { name, email };

  if (!customer?.name?.trim() || !customer?.email?.trim()) {
    return res.status(400).json({ error: "Name and email are required" });
  }

  try {
    const cartItems = await dbAll(
      `SELECT ci.id, ci.product_id, ci.quantity,
              p.name, p.price,
              (ci.quantity * p.price) AS item_total
       FROM cart_items ci
       JOIN products p ON ci.product_id = p.id
       WHERE ci.cart_id = ?`,
      [req.session.cartId]
    );

    if (cartItems.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    const total = cartItems.reduce((sum, r) => sum + r.item_total, 0);

    const receipt = {
      orderId: uuidv4(),
      customer,
      items: cartItems,
      total: parseFloat(total.toFixed(2)),
      timestamp: new Date().toISOString(),
      status: "confirmed",
    };

    await dbRun("DELETE FROM cart_items WHERE cart_id = ?", [req.session.cartId]);

    res.json(receipt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Start ─────────────────────────────────────────────────────────────────────

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
