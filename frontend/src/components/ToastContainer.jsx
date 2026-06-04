/**
 * ToastContainer
 * Renders toasts in the bottom-right corner.
 * Pass { toasts } from the useToast hook.
 */
export default function ToastContainer({ toasts }) {
  if (!toasts.length) return null;

  const styles = {
    success: "bg-green-600",
    error:   "bg-red-600",
    info:    "bg-gray-800",
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`
            ${styles[t.type] ?? styles.info}
            text-white text-sm font-medium
            px-4 py-2.5 rounded-lg shadow-lg
            animate-fade-in
            pointer-events-auto
            max-w-xs
          `}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
