import { useParams } from "react-router-dom";

export default function DatosGeneralesPage() {
  const { id } = useParams();

  return (
    <div>

      <h2 className="text-xl font-semibold text-slate-800 mb-4">
        Datos generales
      </h2>

      <p className="text-sm text-slate-600 mb-6">
        Aquí se editará la información general de la buena práctica.
      </p>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-sm text-slate-700">
        Buena práctica ID: <strong>{id}</strong>
      </div>

    </div>
  );
}