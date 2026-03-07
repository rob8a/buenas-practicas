import AppShell from "../components/layout/AppShell";
import { getUser } from "../lib/auth";

export default function Dashboard() {
  const user = getUser();

  return (
    <AppShell title="Inicio">
      <div className="grid gap-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Bienvenido al sistema
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Esta es la base protegida del sistema institucional. A partir de aquí
            vamos a integrar el listado, la ficha, la autoevaluación y la
            evaluación de pares.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Usuario</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {user?.usuario || "N/D"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Nombre</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {user?.nombre || "N/D"}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-sm font-medium text-slate-500">Rol</div>
            <div className="mt-2 text-lg font-semibold text-slate-900">
              {user?.roles?.join(", ") || "N/D"}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
          <div className="text-sm font-medium text-slate-500">
            Próximo paso
          </div>
          <div className="mt-2 text-base text-slate-800">
            Migrar la pantalla de <strong>Listado de Buenas Prácticas</strong> a
            React.
          </div>
        </section>
      </div>
    </AppShell>
  );
}