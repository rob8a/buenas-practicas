import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getUser } from "../../lib/auth";
import { apiFetch } from "../../lib/api";
import { useBuenaPractica } from "../../hooks/useBuenaPractica";

const initialForm = {
  titulo: "",
  unidad_organizacional_id: "",
  descripcion_breve: "",
  subtitulo_lema: "",
  periodo_implementacion: "",
};

export default function DatosGeneralesPage() {
  const { id } = useParams();
  const user = getUser();

  const { buenaPractica, loading, error, reload } = useBuenaPractica(id);

  const [unidades, setUnidades] = useState([]);
  const [loadingUnidades, setLoadingUnidades] = useState(true);
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadUnidades() {
      try {
        setLoadingUnidades(true);
        const response = await apiFetch("/api/v1/unidades-organizacionales");
        setUnidades(response.data || []);
      } catch (err) {
        setSaveError(err.message || "No se pudieron cargar las unidades organizacionales.");
      } finally {
        setLoadingUnidades(false);
      }
    }

    loadUnidades();
  }, []);

  useEffect(() => {
    if (!buenaPractica) return;

    setForm({
      titulo: buenaPractica.titulo || "",
      unidad_organizacional_id: buenaPractica.unidad_organizacional_id
        ? String(buenaPractica.unidad_organizacional_id)
        : "",
      descripcion_breve: buenaPractica.descripcion_breve || "",
      subtitulo_lema:
        buenaPractica.buena_practica_datos_generales?.subtitulo_lema || "",
      periodo_implementacion:
        buenaPractica.buena_practica_datos_generales?.periodo_implementacion || "",
    });
  }, [buenaPractica]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaveError("");
    setSuccess("");

    try {
      setSaving(true);

      await apiFetch(`/api/v1/buenas-practicas/${id}/datos-generales`, {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          unidad_organizacional_id: Number(form.unidad_organizacional_id),
          actualizado_por_id: user?.id,
        }),
      });

      setSuccess("Datos generales actualizados correctamente.");
      await reload();
    } catch (err) {
      setSaveError(err.message || "No fue posible actualizar los datos generales.");
    } finally {
      setSaving(false);
    }
  }

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
          Actualiza la información general de la buena práctica.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Título
          </label>
          <input
            name="titulo"
            value={form.titulo}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Unidad organizacional
          </label>
          <select
            name="unidad_organizacional_id"
            value={form.unidad_organizacional_id}
            onChange={handleChange}
            disabled={loadingUnidades}
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">
              {loadingUnidades ? "Cargando..." : "Seleccione una unidad organizacional"}
            </option>
            {unidades.map((unidad) => (
              <option key={unidad.id} value={unidad.id}>
                {unidad.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Descripción breve
          </label>
          <textarea
            name="descripcion_breve"
            value={form.descripcion_breve}
            onChange={handleChange}
            rows={4}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Subtítulo o lema
          </label>
          <input
            name="subtitulo_lema"
            value={form.subtitulo_lema}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Periodo de implementación
          </label>
          <input
            name="periodo_implementacion"
            value={form.periodo_implementacion}
            onChange={handleChange}
            className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </div>

        {saveError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {saveError}
          </div>
        ) : null}

        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </form>
    </div>
  );
}