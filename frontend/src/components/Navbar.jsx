export default function Navbar({
  activeView,
  setActiveView,
  cartItemCount,
  productCount,
}) {
  return (
    <header className="sticky top-0 z-40 bg-[#FFF8E6]/80 backdrop-blur-md border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <h1
            onClick={() => setActiveView("products")}
            className="text-lg font-semibold tracking-tight select-none cursor-pointer"
          >
            <span className="text-gray-900">Vibe</span>
            <span className="text-gray-500">Commerce</span>
          </h1>

          <nav className="flex items-center gap-6">
            <button
              onClick={() => setActiveView("products")}
              className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]

                  ${
                    activeView === "products"
                      ? "bg-[#FFF8E6] text-gray-900"
                      : "bg-[#FFFDF0] text-gray-700 hover:bg-[#EFF3EA]"
                  }
                `}
            >
              Products ({productCount})
            </button>

            <button
              onClick={() => setActiveView("cart")}
              className={`text-sm font-medium px-4 py-2 rounded-full transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]

                  ${
                    activeView === "cart"
                      ? "bg-[#FFF8E6] text-gray-900"
                      : "bg-[#FFFDF0] text-gray-700 hover:bg-[#EFF3EA]"
                  }
                `}
            >
              Cart ({cartItemCount})
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
