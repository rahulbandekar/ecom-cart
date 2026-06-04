import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Navbar from "./components/Navbar";
import ProductCard from "./components/ProductCard";
import CartItem from "./components/CartItem";
import ToastContainer from "./components/ToastContainer";
import { useToast } from "./hooks/useToast";

// Fallback to localhost so missing .env doesn't silently break everything
const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

// Axios instance with credentials so session cookies are sent
const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export default function App() {
  const [products, setProducts]         = useState([]);
  const [cart, setCart]                 = useState({ items: [], total: 0 });
  const [activeView, setActiveView]     = useState("products");
  const [checkoutInfo, setCheckoutInfo] = useState({ name: "", email: "" });
  const [receipt, setReceipt]           = useState(null);

  // Per-product add-to-cart loading: Set<productId>
  const [addingIds, setAddingIds]       = useState(new Set());

  // Per-cart-item mutation loading maps
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);

  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const { toasts, toast } = useToast();

  // ── Data fetchers ─────────────────────────────────────────────────────────

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await api.get("/products");
      setProducts(data);
    } catch {
      toast("Could not load products. Is the server running?", "error");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCart = useCallback(async () => {
    try {
      const { data } = await api.get("/cart");
      setCart(data);
    } catch {
      toast("Could not load cart.", "error");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchProducts();
    fetchCart();
  }, [fetchProducts, fetchCart]);

  // ── Cart actions ──────────────────────────────────────────────────────────

  const addToCart = async (productId) => {
    setAddingIds((prev) => new Set(prev).add(productId));
    try {
      await api.post("/cart", { productId, quantity: 1 });
      await fetchCart();
      toast("Added to cart!", "success");
    } catch {
      toast("Could not add item to cart.", "error");
    } finally {
      setAddingIds((prev) => {
        const next = new Set(prev);
        next.delete(productId);
        return next;
      });
    }
  };

  const removeFromCart = async (cartItemId) => {
    setRemovingItemId(cartItemId);
    try {
      await api.delete(`/cart/${cartItemId}`);
      await fetchCart();
      toast("Item removed.", "info");
    } catch {
      toast("Could not remove item.", "error");
    } finally {
      setRemovingItemId(null);
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;
    setUpdatingItemId(cartItemId);
    try {
      await api.put(`/cart/${cartItemId}`, { quantity: newQuantity });
      await fetchCart();
    } catch {
      toast("Could not update quantity.", "error");
    } finally {
      setUpdatingItemId(null);
    }
  };

  // ── Checkout ──────────────────────────────────────────────────────────────

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.items.length === 0) {
      toast("Your cart is empty.", "error");
      return;
    }

    setCheckoutLoading(true);
    try {
      const { data } = await api.post("/checkout", {
        customerInfo: checkoutInfo,
      });
      setReceipt(data);
      // Clear local state AFTER we have the receipt, not before
      setCart({ items: [], total: 0 });
      setCheckoutInfo({ name: "", email: "" });
      setActiveView("receipt");
    } catch (err) {
      const message =
        err.response?.data?.error || "Checkout failed. Please try again.";
      toast(message, "error");
    } finally {
      setCheckoutLoading(false);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────

  const cartItemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#D9DFC6]/20">
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        cartItemCount={cartItemCount}
        productCount={products.length}
      />

      <main className="container mx-auto px-4 py-8">

        {/* ── Products ── */}
        {activeView === "products" && (
          <div>
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-8">
              Our Products
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                  isAdding={addingIds.has(product.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Cart ── */}
        {activeView === "cart" && (
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-8">
              Your Shopping Cart
            </h2>
            {cart.items.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🛒</div>
                <p className="text-xl text-gray-900">Your cart is empty</p>
                <button
                  onClick={() => setActiveView("products")}
                  className="px-5 py-2.5 rounded-full bg-[#FFFDF0] text-gray-700 hover:bg-[#EFF3EA] mt-4"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <>
                <div className="card mb-6">
                  <div className="space-y-6">
                    {cart.items.map((item) => (
                      <CartItem
                        key={item.cartId}
                        item={item}
                        isUpdating={updatingItemId === item.cartId}
                        isRemoving={removingItemId === item.cartId}
                        onIncrease={() =>
                          updateQuantity(item.cartId, item.quantity + 1)
                        }
                        onDecrease={() => {
                          if (item.quantity === 1) {
                            removeFromCart(item.cartId);
                          } else {
                            updateQuantity(item.cartId, item.quantity - 1);
                          }
                        }}
                        onRemove={() => removeFromCart(item.cartId)}
                      />
                    ))}
                  </div>
                </div>

                <div className="card text-center">
                  <h3 className="text-2xl font-bold text-gray-800 mb-4">
                    Total: ${cart.total.toFixed(2)}
                  </h3>
                  <button
                    onClick={() => setActiveView("checkout")}
                    className="px-6 py-3 rounded-full bg-black text-white text-sm font-medium hover:opacity-90 transition"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Checkout ── */}
        {activeView === "checkout" && (
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-semibold text-center text-gray-800 mb-8">
              Checkout
            </h2>
            <form onSubmit={handleCheckout} className="card">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={checkoutInfo.name}
                    onChange={(e) =>
                      setCheckoutInfo({ ...checkoutInfo, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900/20 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={checkoutInfo.email}
                    onChange={(e) =>
                      setCheckoutInfo({ ...checkoutInfo, email: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-transparent"
                    required
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">Order Summary</h4>
                  <div className="space-y-2">
                    {cart.items.map((item) => (
                      <div key={item.cartId} className="flex justify-between text-sm">
                        <span>{item.name} × {item.quantity}</span>
                        <span>${(item.quantity * item.price).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>${cart.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={() => setActiveView("cart")}
                    className="btn-secondary flex-1"
                  >
                    Back to Cart
                  </button>
                  <button
                    type="submit"
                    disabled={checkoutLoading}
                    className="btn-success flex-1 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {checkoutLoading ? "Processing…" : "Confirm Order"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ── Receipt modal ── */}
        {activeView === "receipt" && receipt && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4">
              <h2 className="text-lg font-semibold text-center text-gray-600">
                Order Confirmed 🎉
              </h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order ID</span>
                  <span className="text-right break-all">{receipt.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date</span>
                  <span>{new Date(receipt.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Customer</span>
                  <span className="text-right">{receipt.customer.name}</span>
                </div>
              </div>

              <div className="border-t pt-3 space-y-2 text-sm">
                {receipt.items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>{item.name} × {item.quantity}</span>
                    <span>${(item.quantity * item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-3 flex justify-between font-semibold">
                <span>Total</span>
                <span>${receipt.total.toFixed(2)}</span>
              </div>

              <button
                onClick={() => {
                  setReceipt(null);
                  setActiveView("products");
                }}
                className="w-full py-2.5 rounded-lg bg-black text-white hover:opacity-90"
              >
                Continue Shopping
              </button>
            </div>
          </div>
        )}
      </main>

      <ToastContainer toasts={toasts} />
    </div>
  );
}
