import { useParams } from "react-router-dom";
import AppShell from "../components/layout/AppShell";

export default function FichaPage() {
  const { id } = useParams();

  return (
    <AppShell title="Ficha de la buena práctica">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">
          Ficha de la buena práctica
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          La buena práctica fue creada correctamente.
        </p>
        <p className="mt-2 text-sm text-slate-600">
          ID de la buena práctica: <strong>{id}</strong>
        </p>
        <p className="mt-4 text-sm text-slate-600">
          Aquí continuaremos con el llenado de la ficha en los siguientes pasos.
        </p>
      </div>
    </AppShell>
  );
}