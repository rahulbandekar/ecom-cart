import express from "express";
import cors from "cors";
import { v4 as uuidv4 } from "uuid";
import sqlite3 from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:3000", // CRA dev
      "http://localhost:5173", // Vite dev
      "https://ecom-cart-ruby.vercel.app/"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize SQLite Database
const db = new sqlite3.Database(path.join(__dirname, "data.sqlite"));

const products = [
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


// Initialize database tables
db.serialize(() => {
  // Products table
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      image TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Cart items table
  db.run(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id TEXT PRIMARY KEY,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id)
    )
  `);
});

  // Insert mock products
  db.get("SELECT COUNT(*) as count FROM products", (err, row) => {
    if (err) {
      console.error(err);
      return;
    }

    if (row.count === 0) {
      const stmt = db.prepare(
        "INSERT INTO products (id, name, price, image, description) VALUES (?, ?, ?, ?, ?)"
      );

      products.forEach((product) => {
        stmt.run(
          product.id,
          product.name,
          product.price,
          product.image,
          product.description
        );
      });

      stmt.finalize();
      console.log("Mock products seeded");
    }
  });


// Routes

// GET /api/products - Get all products
app.get("/api/products", (req, res) => {
  db.all("SELECT * FROM products", (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// GET /api/cart - Get cart items with total
app.get("/api/cart", (req, res) => {
  const query = `
    SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price, p.image,
           (ci.quantity * p.price) as item_total
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
  `;

  db.all(query, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    const total = rows.reduce((sum, item) => sum + item.item_total, 0);
    res.json({
      items: rows.map((item) => ({
        cartId: item.id,
        productId: item.product_id,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        itemTotal: item.item_total,
      })),
      total: parseFloat(total.toFixed(2)),
    });
  });
});

// POST /api/cart - Add item to cart
app.post("/api/cart", (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity || quantity < 1) {
    return res.status(400).json({ error: "Invalid productId or quantity" });
  }

  // Check if product exists
  db.get("SELECT * FROM products WHERE id = ?", [productId], (err, product) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check if item already in cart
    db.get(
      "SELECT * FROM cart_items WHERE product_id = ?",
      [productId],
      (err, existingItem) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (existingItem) {
          // Update quantity
          const newQuantity = existingItem.quantity + quantity;
          db.run(
            "UPDATE cart_items SET quantity = ? WHERE product_id = ?",
            [newQuantity, productId],
            function (err) {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              res.json({
                message: "Cart updated successfully",
                cartItemId: existingItem.id,
              });
            }
          );
        } else {
          // Add new item
          const cartItemId = uuidv4();
          db.run(
            "INSERT INTO cart_items (id, product_id, quantity) VALUES (?, ?, ?)",
            [cartItemId, productId, quantity],
            function (err) {
              if (err) {
                return res.status(500).json({ error: err.message });
              }
              res.json({ message: "Item added to cart", cartItemId });
            }
          );
        }
      }
    );
  });
});

// DELETE /api/cart/:id - Remove item from cart
app.delete("/api/cart/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM cart_items WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Cart item not found" });
    }
    res.json({ message: "Item removed from cart" });
  });
});

// PUT /api/cart/:id - Update item quantity
app.put("/api/cart/:id", (req, res) => {
  const { id } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: "Invalid quantity" });
  }

  db.run(
    "UPDATE cart_items SET quantity = ? WHERE id = ?",
    [quantity, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      res.json({ message: "Cart item updated successfully" });
    }
  );
});

// POST /api/checkout - Process checkout
app.post("/api/checkout", (req, res) => {
  const { customerInfo, name, email } = req.body;

  const finalCustomer = customerInfo || { name, email };

  if (!finalCustomer?.name || !finalCustomer?.email) {
    return res.status(400).json({ error: "Name and email are required" });
  }


  // Get current cart
  db.all(
    `
    SELECT ci.id, ci.product_id, ci.quantity, p.name, p.price,
           (ci.quantity * p.price) as item_total
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
  `,
    (err, cartItems) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (cartItems.length === 0) {
        return res.status(400).json({ error: "Cart is empty" });
      }

      const total = cartItems.reduce((sum, item) => sum + item.item_total, 0);

      // Create receipt
      const receipt = {
        orderId: uuidv4(),
        customer: finalCustomer,
        items: cartItems,
        total: parseFloat(total.toFixed(2)),
        timestamp: new Date().toISOString(),
        status: "confirmed",
      };
      

      // Clear cart after successful checkout
      db.run("DELETE FROM cart_items", (err) => {
        if (err) {
          console.error("Error clearing cart:", err);
        }
      });

      res.json(receipt);
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
