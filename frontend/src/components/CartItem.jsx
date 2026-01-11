export default function CartItem({
    item,
    onIncrease,
    onDecrease,
    onRemove,
    isUpdating,
    isRemoving,
  }) {
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between py-4 border-b border-gray-200 last:border-b-0">
        
        {/* Product info */}
        <div className="flex-1 mb-4 sm:mb-0">
          <h4 className="font-semibold text-gray-800">
            {item.name}
          </h4>
          <p className="text-gray-900">
            ${item.price}
          </p>
        </div>
  
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onDecrease}
              disabled={isUpdating || isRemoving}
              className="w-8 h-8 rounded-full border border-gray-300
                         flex items-center justify-center
                         hover:bg-gray-100 disabled:opacity-50"
            >
              −
            </button>
  
            <span className="font-semibold w-8 text-center">
              {item.quantity}
            </span>
  
            <button
              onClick={onIncrease}
              disabled={isUpdating}
              className="w-8 h-8 rounded-full border border-gray-300
                         flex items-center justify-center
                         hover:bg-gray-100 disabled:opacity-50"
            >
              +
            </button>
          </div>
  
          <div className="font-semibold text-gray-600 w-20 text-right">
            ${(item.quantity * item.price).toFixed(2)}
          </div>
  
          <button
            onClick={onRemove}
            disabled={isRemoving}
            className="text-red-600 text-sm hover:underline disabled:opacity-50"
          >
            Remove
          </button>
        </div>
      </div>
    );
  }
  