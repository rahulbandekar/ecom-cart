/**
 * CartItem
 *
 * Props:
 *   item        — cart item object
 *   isUpdating  — boolean
 *   isRemoving  — boolean
 *   onIncrease  — callback
 *   onDecrease  — callback
 *   onRemove    — callback
 */
export default function CartItem({
  item,
  onIncrease,
  onDecrease,
  onRemove,
  isUpdating,
  isRemoving,
}) {
  const isBusy = isUpdating || isRemoving;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between py-4 border-b border-gray-200 last:border-b-0">

      {/* Product info */}
      <div className="flex-1 mb-4 sm:mb-0">
        <h4 className="font-semibold text-gray-800">{item.name}</h4>
        <p className="text-sm text-gray-500">${item.price.toFixed(2)} each</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onDecrease}
            disabled={isBusy}
            aria-label="Decrease quantity"
            className="w-8 h-8 rounded-full border border-gray-300
                       flex items-center justify-center
                       hover:bg-gray-100 disabled:opacity-50 transition"
          >
            −
          </button>

          <span className="font-semibold w-8 text-center">
            {isUpdating ? (
              <span className="inline-block w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              item.quantity
            )}
          </span>

          <button
            onClick={onIncrease}
            disabled={isBusy}
            aria-label="Increase quantity"
            className="w-8 h-8 rounded-full border border-gray-300
                       flex items-center justify-center
                       hover:bg-gray-100 disabled:opacity-50 transition"
          >
            +
          </button>
        </div>

        <div className="font-semibold text-gray-700 w-20 text-right">
          ${(item.quantity * item.price).toFixed(2)}
        </div>

        <button
          onClick={onRemove}
          disabled={isBusy}
          className="text-red-500 text-sm hover:underline disabled:opacity-50 transition"
        >
          {isRemoving ? "Removing…" : "Remove"}
        </button>
      </div>
    </div>
  );
}
