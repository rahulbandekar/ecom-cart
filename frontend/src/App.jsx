import React, { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./components/Navbar";
import ProductCard from "./components/ProductCard";
import CartItem from "./components/CartItem";

const API_BASE = "http://localhost:5000/api";

function App() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState({ items: [], total: 0 });
  const [activeView, setActiveView] = useState("products");
  const [checkoutInfo, setCheckoutInfo] = useState({ name: "", email: "" });
  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [removingItemId, setRemovingItemId] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchCart();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API_BASE}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API_BASE}/cart`);
      setCart(response.data);
    } catch (error) {
      console.error("Error fetching cart:", error);
    }
  };

  const addToCart = async (productId) => {
    try {
      setLoading(true);
      await axios.post(`${API_BASE}/cart`, { productId, quantity: 1 });
      await fetchCart();
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Error adding item to cart");
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (cartItemId) => {
    try {
      setRemovingItemId(cartItemId);
      await axios.delete(`${API_BASE}/cart/${cartItemId}`);
      await fetchCart();
    } catch (error) {
      console.error("Error removing from cart:", error);
      alert("Error removing item from cart");
    } finally {
      setRemovingItemId(null);
    }
  };

  const updateQuantity = async (cartItemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      setUpdatingItemId(cartItemId);
      await axios.put(`${API_BASE}/cart/${cartItemId}`, {
        quantity: newQuantity,
      });
      await fetchCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
      alert("Error updating quantity");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (cart.items.length === 0) {
      alert("Your cart is empty");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE}/checkout`, {
        customerInfo: checkoutInfo,
      });
      setReceipt(response.data);
      setActiveView("receipt");
      setCart({ items: [], total: 0 });
      setCheckoutInfo({ name: "", email: "" });
    } catch (error) {
      console.error("Error during checkout:", error);
      alert("Error during checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const cartItemCount = cart.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const productCount = products.length;

  return (
    <div className="min-h-screen bg-[#D9DFC6]/20">
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        cartItemCount={cartItemCount}
        productCount={productCount}
      />
      <main className="container mx-auto px-4 py-8">
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
                  loading={loading}
                />
              ))}
            </div>
          </div>
        )}

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
                    className="px-6 py-3 rounded-full bg-black text-white text-sm font-medium
           hover:opacity-90 transition"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {activeView === "checkout" && (
          <div className="max-w-md mx-auto">
            <h2
              disabled={cart.items.length === 0}
              className="text-2xl font-semibold text-center text-gray-800 mb-8"
            >
              Checkout
            </h2>
            <form onSubmit={handleCheckout} className="card">
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={checkoutInfo.name}
                    onChange={(e) =>
                      setCheckoutInfo({ ...checkoutInfo, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900/2 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={checkoutInfo.email}
                    onChange={(e) =>
                      setCheckoutInfo({
                        ...checkoutInfo,
                        email: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/2 focus:border-transparent"
                    required
                  />
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-800 mb-3">
                    Order Summary
                  </h4>
                  <div className="space-y-2">
                    {cart.items.map((item) => (
                      <div
                        key={item.cartId}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {item.name} x {item.quantity}
                        </span>
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
                    disabled={loading}
                    className="btn-success flex-1 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    {loading ? "Processing..." : "Confirm Order"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {activeView === "receipt" && receipt && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center px-4 z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full space-y-4">
              <h2 className="text-lg font-semibold text-center text-gray-600">
                Order Confirmed 🎉
              </h2>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order ID</span>
                  <span className="text-right break-all">
                    {receipt.orderId}
                  </span>
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
                  <div key={item.cartId} className="flex justify-between">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
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
    </div>
  );
}

export default App;
