# 🛒 Vibe Commerce — Mock E-Commerce Cart

A minimal, full-stack mock e-commerce cart application built as part of a technical screening assignment.  
The project focuses on core e-commerce flows, clean UX, and maintainable code without over-engineering.

---

## ✨ Features

- Product listing with mock data
- Add, update, and remove items from cart
- Real-time cart total calculation
- Per-item loading states (no global blocking loaders)
- Mock checkout flow with receipt modal
- Responsive and minimal UI using Tailwind CSS
- Backend persistence using SQLite

---

## 🧱 Tech Stack

### Frontend
- React
- Tailwind CSS
- Axios

### Backend
- Node.js
- Express.js
- SQLite (file-based database)
- REST APIs

---

## 🎨 Design & UX Decisions

- Clean, neutral color palette to keep focus on content
- Per-item loading states for better cart UX
- Receipt displayed as a modal to preserve user flow
- Mobile-first responsive cart layout
- No unnecessary libraries or state managers

---

## 📂 Project Structure

ecom-cart/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   └── CartItem.jsx
│   │   ├── App.jsx
│   │   └── index.css
│   └── package.json
│
├── backend/
│   ├── server.js
│   ├── data.sqlite
│   └── package.json
│
└── README.md


---

## 🔌 API Endpoints

### Products
- **GET `/api/products`**  
  Returns a list of mock products.

### Cart
- **GET `/api/cart`**  
  Returns cart items and total.
- **POST `/api/cart`**  
  Adds a product to the cart.
- **PUT `/api/cart/:id`**  
  Updates the quantity of a cart item.
- **DELETE `/api/cart/:id`**  
  Removes an item from the cart.

### Checkout
- **POST `/api/checkout`**  
  Returns a mock receipt containing total and timestamp.

---

## ▶️ Running the Project Locally

### 1. Clone the repository
```bash
git clone <repository-url>
cd ecom-cart

2. Start the backend
   ```bash
   cd backend
   npm install
   npm run dev
   ```

   Backend runs on:
   http://localhost:5000

3. Start the frontend
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

   Frontend runs on:
   http://localhost:5173