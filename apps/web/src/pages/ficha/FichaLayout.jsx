import { NavLink, Outlet, useParams } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";

const steps = [
  { key: "datos-generales", label: "Datos generales" },
  { key: "contexto", label: "Contexto y propósito" },
  { key: "fundamentacion", label: "Fundamentación" },
  { key: "metodologia", label: "Metodología y desarrollo" },
  { key: "foda", label: "FODA" },
  { key: "participacion", label: "Participación y colaboración" },
  { key: "evaluacion", label: "Evaluación e indicadores" },
  { key: "impacto", label: "Impacto y sostenibilidad" },
  { key: "conclusiones", label: "Conclusiones" }
];

export default function FichaLayout() {
  const { id } = useParams();

  return (
    <AppShell title="Ficha de la buena práctica">
      <div className="flex flex-col lg:flex-row gap-6">

        {/* SIDEBAR */}
        <aside className="lg:w-72 shrink-0">

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">

            <div className="mb-4">
              <p className="text-xs text-slate-500">Buena práctica</p>
              <p className="font-semibold text-slate-800">ID #{id}</p>
            </div>

            <nav className="space-y-1">

              {steps.map((step, index) => (
                <NavLink
                  key={step.key}
                  to={`/app/ficha/${id}/${step.key}`}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition
                    ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "text-slate-700 hover:bg-slate-100"
                    }`
                  }
                >
                  <span className="text-xs font-semibold w-6 text-center">
                    {index + 1}
                  </span>

                  <span>{step.label}</span>
                </NavLink>
              ))}

            </nav>

          </div>
        </aside>

        {/* CONTENIDO */}
        <main className="flex-1">

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">

            <Outlet />

          </div>

        </main>

      </div>
    </AppShell>
  );
}