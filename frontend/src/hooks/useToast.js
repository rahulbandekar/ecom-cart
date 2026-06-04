import { useState, useCallback } from "react";

let _id = 0;

/**
 * useToast — returns { toasts, toast }
 *
 * toast(message, type?)   type: "success" | "error" | "info"  (default "info")
 * Toasts auto-dismiss after 3.5 s.
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message, type = "info") => {
      const id = ++_id;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 3500);
    },
    [dismiss]
  );

  return { toasts, toast };
}
