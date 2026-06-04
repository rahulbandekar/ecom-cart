/**
 * ProductCard
 *
 * Props:
 *   product   — product object from API
 *   onAddToCart(productId) — callback
 *   isAdding  — boolean, true when THIS product is being added (not a global flag)
 */
export default function ProductCard({ product, onAddToCart, isAdding }) {
  return (
    <div
      className="bg-[#FFFDF0] rounded-2xl p-4 shadow-sm border border-black/5
                 transition-all duration-200 hover:shadow-md hover:-translate-y-[1px]"
    >
      <img
        src={product.image || "/image.png"}
        alt={product.name}
        onError={(e) => {
          e.currentTarget.src = "/default-product.png";
        }}
        className="w-full h-40 object-contain rounded-xl bg-white p-3"
      />

      <h3 className="mt-3 text-sm font-medium text-gray-900 line-clamp-2">
        {product.name}
      </h3>

      {product.description && (
        <p className="mt-1 text-xs text-gray-400 line-clamp-2">
          {product.description}
        </p>
      )}

      <p className="mt-1 text-sm font-semibold text-gray-700">
        ${product.price.toFixed(2)}
      </p>

      <button
        onClick={() => onAddToCart(product.id)}
        disabled={isAdding}
        className="mt-4 w-full text-sm font-medium px-4 py-2 rounded-full
                   bg-[#FFFDF0] text-gray-700 shadow-sm
                   transition-all duration-200
                   hover:bg-[#EFF3EA] hover:shadow-md
                   active:scale-[0.98]
                   disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isAdding ? "Adding…" : "Add to Cart"}
      </button>
    </div>
  );
}
