import { Menu, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { getUser, clearSession } from "../../lib/auth";
import { useNavigate } from "react-router-dom";

export default function AppHeader({
  title = "Panel principal",
  onMenuClick,
  collapsed,
  onToggleCollapse,
}) {
  const user = getUser();
  const navigate = useNavigate();

  function handleLogout() {
    clearSession();
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden rounded-xl p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:inline-flex"
            aria-label={collapsed ? "Expandir menú lateral" : "Contraer menú lateral"}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>

          <div>
            <h1 className="text-base font-bold text-slate-900 md:text-lg">
              {title}
            </h1>
            <p className="hidden text-xs text-slate-500 md:block">
              Sistema de Buenas Prácticas Institucionales
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right md:block">
            <div className="text-sm font-semibold text-slate-900">
              {user?.nombre || user?.usuario || "Usuario"}
            </div>
            <div className="text-xs text-slate-500">
              {user?.roles?.join(", ") || "Sin rol"}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
}