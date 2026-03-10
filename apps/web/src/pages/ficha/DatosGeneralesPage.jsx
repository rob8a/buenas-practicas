import { useParams } from "react-router-dom";
import { useBuenaPractica } from "../../hooks/useBuenaPractica";

export default function DatosGeneralesPage() {
  const { id } = useParams();
  const { buenaPractica, loading, error } = useBuenaPractica(id);

  if (loading) {
    return (
      <div className="text-sm text-slate-600">
        Cargando información de la buena práctica...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!buenaPractica) {
    return (
      <div className="text-sm text-slate-600">
        No se encontró la buena práctica.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800">
          Datos generales
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Aquí se muestra la información inicial registrada para la buena práctica.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Título
          </div>
          <div className="mt-2 text-sm text-slate-900">
            {buenaPractica.titulo}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Unidad organizacional
          </div>
          <div className="mt-2 text-sm text-slate-900">
            {buenaPractica.unidad_organizacional?.nombre || "N/D"}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Descripción breve
          </div>
          <div className="mt-2 text-sm text-slate-900">
            {buenaPractica.descripcion_breve}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Subtítulo o lema
          </div>
          <div className="mt-2 text-sm text-slate-900">
            {buenaPractica.buena_practica_datos_generales?.subtitulo_lema || "N/D"}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Periodo de implementación
          </div>
          <div className="mt-2 text-sm text-slate-900">
            {buenaPractica.buena_practica_datos_generales?.periodo_implementacion || "N/D"}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Tipo de registro
          </div>
          <div className="mt-2 text-sm text-slate-900">
            {buenaPractica.tipo_registro}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Estatus actual
          </div>
          <div className="mt-2 text-sm text-slate-900">
            {buenaPractica.buena_practica_estatus?.nombre || "N/D"}
          </div>
        </div>
      </div>
    </div>
  );
}