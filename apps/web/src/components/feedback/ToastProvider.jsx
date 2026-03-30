import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from "lucide-react";

const ToastContext = createContext(null);

const TOAST_DURATION = 3500;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timeoutsRef = useRef(new Map());

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));

    const timeout = timeoutsRef.current.get(id);
    if (timeout) {
      clearTimeout(timeout);
      timeoutsRef.current.delete(id);
    }
  }, []);

  const showToast = useCallback(
    ({
      type = "info",
      title = "",
      message = "",
      duration = TOAST_DURATION,
    }) => {
      const id = crypto.randomUUID();

      const toast = {
        id,
        type,
        title,
        message,
      };

      setToasts((prev) => [...prev, toast]);

      const timeout = setTimeout(() => {
        removeToast(id);
      }, duration);

      timeoutsRef.current.set(id, timeout);

      return id;
    },
    [removeToast]
  );

  const value = useMemo(
    () => ({
      showToast,
      removeToast,
      success: (message, title = "Operación realizada") =>
        showToast({ type: "success", title, message }),
      error: (message, title = "Ocurrió un error") =>
        showToast({ type: "error", title, message }),
      info: (message, title = "Información") =>
        showToast({ type: "info", title, message }),
      warning: (message, title = "Atención") =>
        showToast({ type: "warning", title, message }),
    }),
    [showToast, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4">
        <div className="flex w-full max-w-md flex-col gap-3">
          {toasts.map((toast) => (
            <ToastCard
              key={toast.id}
              toast={toast}
              onClose={() => removeToast(toast.id)}
            />
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onClose }) {
  const config = getToastConfig(toast.type);
  const Icon = config.icon;

  return (
    <div
      className={[
        "pointer-events-auto rounded-2xl border px-4 py-4 shadow-xl backdrop-blur-sm",
        "animate-[fadeIn_0.18s_ease-out]",
        config.wrapper,
      ].join(" ")}
    >
      <div className="flex items-start gap-3">
        <div
          className={[
            "mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
            config.iconWrapper,
          ].join(" ")}
        >
          <Icon size={18} className={config.iconClass} />
        </div>

        <div className="min-w-0 flex-1">
          {toast.title ? (
            <p className="text-sm font-semibold text-slate-900">
              {toast.title}
            </p>
          ) : null}

          {toast.message ? (
            <p className="mt-1 text-sm leading-5 text-slate-700">
              {toast.message}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-white/70 hover:text-slate-700"
          aria-label="Cerrar notificación"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

function getToastConfig(type) {
  switch (type) {
    case "success":
      return {
        wrapper: "border-emerald-200 bg-white",
        iconWrapper: "bg-emerald-100",
        iconClass: "text-emerald-700",
        icon: CheckCircle2,
      };
    case "error":
      return {
        wrapper: "border-red-200 bg-white",
        iconWrapper: "bg-red-100",
        iconClass: "text-red-700",
        icon: AlertCircle,
      };
    case "warning":
      return {
        wrapper: "border-amber-200 bg-white",
        iconWrapper: "bg-amber-100",
        iconClass: "text-amber-700",
        icon: AlertTriangle,
      };
    case "info":
    default:
      return {
        wrapper: "border-blue-200 bg-white",
        iconWrapper: "bg-blue-100",
        iconClass: "text-blue-700",
        icon: Info,
      };
  }
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast debe usarse dentro de ToastProvider.");
  }

  return context;
}