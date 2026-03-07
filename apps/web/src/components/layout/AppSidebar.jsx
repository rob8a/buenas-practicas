import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ClipboardList,
  FileText,
  CheckSquare,
  Users,
  X,
} from "lucide-react";

const navItems = [
  {
    label: "Inicio",
    to: "/app",
    icon: LayoutDashboard,
  },
  {
    label: "Listado de buenas prácticas",
    to: "/app/listado",
    icon: ClipboardList,
  },
  {
    label: "Ficha",
    to: "/app/ficha",
    icon: FileText,
  },
  {
    label: "Autoevaluación",
    to: "/app/autoevaluacion",
    icon: CheckSquare,
  },
  {
    label: "Evaluación de pares",
    to: "/app/evaluacion-pares",
    icon: Users,
  },
];

function SidebarLink({ item, onNavigate, collapsed }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={item.to === "/app"}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        [
          "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition",
          collapsed ? "justify-center" : "gap-3",
          isActive
            ? "bg-slate-900 text-white"
            : "text-slate-700 hover:bg-slate-100 hover:text-slate-900",
        ].join(" ")
      }
    >
      <Icon size={18} />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );
}

export default function AppSidebar({ mobileOpen, onClose, collapsed }) {
  return (
    <>
      {/* Backdrop móvil */}
      <div
        className={[
          "fixed inset-0 z-30 bg-slate-950/40 transition md:hidden",
          mobileOpen ? "block" : "hidden",
        ].join(" ")}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        className={[
          "fixed left-0 top-0 z-40 h-screen border-r border-slate-200 bg-white transition-all duration-200 md:translate-x-0",
          collapsed ? "w-20" : "w-72",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-full flex-col">
          {/* Header sidebar */}
          <div
            className={[
              "flex items-center border-b border-slate-200 px-5 py-4",
              collapsed ? "justify-center" : "justify-between",
            ].join(" ")}
          >
            {!collapsed && (
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Universidad de Colima
                </div>
                <div className="mt-1 text-sm font-bold text-slate-900">
                  Buenas Prácticas
                </div>
              </div>
            )}

            {collapsed && (
              <div className="text-sm font-bold text-slate-900">BP</div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 md:hidden"
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 space-y-2 overflow-y-auto px-3 py-4">
            {navItems.map((item) => (
              <SidebarLink
                key={item.to}
                item={item}
                onNavigate={onClose}
                collapsed={collapsed}
              />
            ))}
          </nav>

          {/* Footer sidebar */}
          {!collapsed && (
            <div className="border-t border-slate-200 px-4 py-4">
              <div className="rounded-xl bg-slate-50 px-3 py-3 text-xs text-slate-500">
                Sistema institucional para la gestión de buenas prácticas.
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}