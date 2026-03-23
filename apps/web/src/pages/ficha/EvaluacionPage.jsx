import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { useBuenaPractica } from "../../hooks/useBuenaPractica";

const initialForm = {
  instrumentos_evaluacion: "",
  logros_clave: "",
  hallazgos_identificados: "",
};

const initialIndicatorForm = {
  nombre: "",
  indicador: "",
  unidad_medida: "",
  meta_esperada: "",
  descripcion_breve: "",
  periodo: "",
};

const initialTestimonioForm = {
  testimonio: "",
  cargo: "",
};

export default function EvaluacionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buenaPractica, loading, error } = useBuenaPractica(id);

  const [form, setForm] = useState(initialForm);
  const [indicatorForm, setIndicatorForm] = useState(initialIndicatorForm);
  const [testimonioForm, setTestimonioForm] = useState(initialTestimonioForm);

  const [indicadores, setIndicadores] = useState([]);
  const [testimonios, setTestimonios] = useState([]);

  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!buenaPractica) return;

    const evaluacion = buenaPractica.buena_practica_evaluacion_indicadores;

    setForm({
      instrumentos_evaluacion: evaluacion?.instrumentos_evaluacion || "",
      logros_clave: evaluacion?.logros_clave || "",
      hallazgos_identificados: evaluacion?.hallazgos_identificados || "",
    });

    if (Array.isArray(buenaPractica.buena_practica_indicador)) {
      setIndicadores(
        buenaPractica.buena_practica_indicador.map((item) => ({
          id: item.id,
          nombre: item.nombre || "",
          indicador: item.indicador || "",
          unidad_medida: item.unidad_medida || "",
          meta_esperada: item.meta_esperada || "",
          descripcion_breve: item.descripcion_breve || "",
          periodo: item.periodo || "",
        }))
      );
    } else {
      setIndicadores([]);
    }

    if (Array.isArray(buenaPractica.buena_practica_testimonio)) {
      setTestimonios(
        buenaPractica.buena_practica_testimonio.map((item) => ({
          id: item.id,
          testimonio: item.testimonio || "",
          cargo: item.cargo || "",
        }))
      );
    } else {
      setTestimonios([]);
    }

    setIndicatorForm(initialIndicatorForm);
    setTestimonioForm(initialTestimonioForm);
  }, [buenaPractica]);

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleIndicatorFormChange(event) {
    const { name, value } = event.target;
    setIndicatorForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleTestimonioFormChange(event) {
    const { name, value } = event.target;
    setTestimonioForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleAddIndicator() {
    if (!indicatorForm.nombre.trim()) {
      setSaveError("Agrega al menos el nombre del indicador.");
      return;
    }

    setSaveError("");

    setIndicadores((prev) => [
      ...prev,
      {
        tempId: Date.now(),
        nombre: indicatorForm.nombre.trim(),
        indicador: indicatorForm.indicador.trim(),
        unidad_medida: indicatorForm.unidad_medida.trim(),
        meta_esperada: indicatorForm.meta_esperada.trim(),
        descripcion_breve: indicatorForm.descripcion_breve.trim(),
        periodo: indicatorForm.periodo.trim(),
      },
    ]);

    setIndicatorForm(initialIndicatorForm);
  }

  function handleRemoveIndicator(index) {
    setIndicadores((prev) => prev.filter((_, i) => i !== index));
  }

  function handleAddTestimonio() {
    if (!testimonioForm.testimonio.trim()) {
      setSaveError("Agrega al menos el testimonio.");
      return;
    }

    setSaveError("");

    setTestimonios((prev) => [
      ...prev,
      {
        tempId: Date.now(),
        testimonio: testimonioForm.testimonio.trim(),
        cargo: testimonioForm.cargo.trim(),
      },
    ]);

    setTestimonioForm(initialTestimonioForm);
  }

  function handleRemoveTestimonio(index) {
    setTestimonios((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveForm(goNext = false) {
    setSaveError("");
    setSuccess("");

    try {
      setSaving(true);

        await apiFetch(`/api/v1/buenas-practicas/${id}/evaluacion`, {
            method: "PATCH",
            body: JSON.stringify({
                instrumentos_evaluacion: form.instrumentos_evaluacion,
                logros_clave: form.logros_clave,
                hallazgos_identificados: form.hallazgos_identificados,
                indicadores,
                testimonios,
            }),
        });

      if (goNext) {
        navigate(`/app/ficha/${id}/impacto`);
        return;
      }

      setSuccess(
        "Evaluación e indicadores guardados correctamente."
      );
    } catch (err) {
      setSaveError(
        err.message ||
          "No fue posible guardar la información de evaluación e indicadores."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await saveForm(false);
  }

  async function handleNext() {
    await saveForm(true);
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
    <div className="space-y-8">
      {/* Encabezado */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">
          2.7 Evaluación, indicadores y evidencias
        </h2>

        <div className="space-y-1 text-sm leading-6 text-slate-600">
          <p>
            Instrumentos de evaluación, indicadores de logro y evidencias documentales.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Instrumentos de evaluación */}
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Instrumentos de evaluación
            </h3>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Instrumentos de evaluación utilizados
            </label>
            <p className="mb-2 text-xs text-slate-500">
              Especifique instrumentos, técnicas y herramientas empleadas.
            </p>
            <textarea
              name="instrumentos_evaluacion"
              value={form.instrumentos_evaluacion}
              onChange={handleFormChange}
              rows={5}
              placeholder="Rúbricas, encuestas, listas, entre otras..."
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </section>

        {/* Indicadores */}
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Indicadores
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Defina los indicadores en correspondencia directa con el objetivo central de la buena práctica. Si la práctica cuenta con Alineación estratégica institucional (PIDE), utilice o adapte los indicadores correspondientes.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Nombre del indicador
                </label>
                <input
                  name="nombre"
                  value={indicatorForm.nombre}
                  onChange={handleIndicatorFormChange}
                  placeholder="Nombre del indicador"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Indicador (valor)
                </label>
                <input
                  name="indicador"
                  value={indicatorForm.indicador}
                  onChange={handleIndicatorFormChange}
                  placeholder="Indicador (valor)"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Unidad de medida
                </label>
                <input
                  name="unidad_medida"
                  value={indicatorForm.unidad_medida}
                  onChange={handleIndicatorFormChange}
                  placeholder="Unidad de medida"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Meta esperada
                </label>
                <input
                  name="meta_esperada"
                  value={indicatorForm.meta_esperada}
                  onChange={handleIndicatorFormChange}
                  placeholder="Meta esperada"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Periodo
                </label>
                <input
                  name="periodo"
                  value={indicatorForm.periodo}
                  onChange={handleIndicatorFormChange}
                  placeholder="Ej. Semestral, anual..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Descripción breve
                </label>
                <textarea
                  name="descripcion_breve"
                  value={indicatorForm.descripcion_breve}
                  onChange={handleIndicatorFormChange}
                  rows={3}
                  placeholder="Descripción breve"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleAddIndicator}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Agregar indicador
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h4 className="text-sm font-semibold text-slate-800">
                Indicadores agregados
              </h4>
            </div>

            {indicadores.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">
                No se han agregado indicadores aún.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Nombre</th>
                      <th className="px-4 py-3 text-left font-medium">Indicador</th>
                      <th className="px-4 py-3 text-left font-medium">Unidad</th>
                      <th className="px-4 py-3 text-left font-medium">Meta</th>
                      <th className="px-4 py-3 text-left font-medium">Periodo</th>
                      <th className="px-4 py-3 text-center font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {indicadores.map((item, index) => (
                      <tr
                        key={item.id || item.tempId}
                        className="border-t border-slate-200"
                      >
                        <td className="px-4 py-3 text-slate-800">{item.nombre}</td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.indicador || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.unidad_medida || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.meta_esperada || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.periodo || "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveIndicator(index)}
                            className="inline-flex rounded-lg p-2 text-red-600 transition hover:bg-red-50 hover:text-red-700"
                            aria-label="Eliminar indicador"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* Resultados */}
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Resultados</h3>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Logros clave <span className="text-red-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">
              Describa los logros clave, resultados y datos cuantitativos.
            </p>
            <textarea
              name="logros_clave"
              value={form.logros_clave}
              onChange={handleFormChange}
              rows={5}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              ¿Qué hallazgos se identificaron?
            </label>
            <p className="mb-2 text-xs text-slate-500">
              Describir los descubrimientos al implementar la práctica.
            </p>
            <textarea
              name="hallazgos_identificados"
              value={form.hallazgos_identificados}
              onChange={handleFormChange}
              rows={5}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </section>

        {/* Testimonios */}
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Testimonios
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Recopile testimonios de participantes o beneficiarios.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Testimonio o comentario
                </label>
                <textarea
                  name="testimonio"
                  value={testimonioForm.testimonio}
                  onChange={handleTestimonioFormChange}
                  rows={4}
                  placeholder="Testimonio o comentario"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Cargo o rol
                </label>
                <input
                  name="cargo"
                  value={testimonioForm.cargo}
                  onChange={handleTestimonioFormChange}
                  placeholder="Cargo o rol"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleAddTestimonio}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Agregar testimonio
              </button>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h4 className="text-sm font-semibold text-slate-800">
                Testimonios agregados
              </h4>
            </div>

            {testimonios.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">
                No se han agregado testimonios aún.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">
                        Testimonio
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Cargo o rol
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {testimonios.map((item, index) => (
                      <tr
                        key={item.id || item.tempId}
                        className="border-t border-slate-200"
                      >
                        <td className="px-4 py-3 text-slate-800">
                          {item.testimonio}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {item.cargo || "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveTestimonio(index)}
                            className="inline-flex rounded-lg p-2 text-red-600 transition hover:bg-red-50 hover:text-red-700"
                            aria-label="Eliminar testimonio"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

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

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Puedes guardar el avance actual como borrador o guardar y continuar al
            siguiente apartado de la ficha.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Guardando..." : "Guardar borrador"}
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={saving}
              className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? "Guardando..." : "Guardar y continuar"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}