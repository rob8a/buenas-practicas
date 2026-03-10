import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { useBuenaPractica } from "../../hooks/useBuenaPractica";

const initialForm = {
  entorno: "",
  necesidad_problematica: "",
  vinculacion_metas: "",
  estado_practica: "",
  proposito_general: "",
  objetivo_central: "",
  poblacion_beneficiaria: "",
  condiciones_origen: "",
};

const initialTimelineForm = {
  fecha: "",
  nombre: "",
  descripcion: "",
};

export default function ContextoPropositoPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { buenaPractica, loading, error } = useBuenaPractica(id);

  const [form, setForm] = useState(initialForm);
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const [unidades, setUnidades] = useState([]);
  const [loadingUnidades, setLoadingUnidades] = useState(true);
  const [unidadSearch, setUnidadSearch] = useState("");
  const [unidadesSeleccionadas, setUnidadesSeleccionadas] = useState([]);

  const [timelineForm, setTimelineForm] = useState(initialTimelineForm);
  const [timelineItems, setTimelineItems] = useState([]);

  useEffect(() => {
    async function loadUnidades() {
      try {
        setLoadingUnidades(true);
        const response = await apiFetch("/api/v1/unidades-organizacionales");
        setUnidades(response.data || []);
      } catch (err) {
        setSaveError(
          err.message || "No se pudieron cargar las unidades organizacionales."
        );
      } finally {
        setLoadingUnidades(false);
      }
    }

    loadUnidades();
  }, []);

  useEffect(() => {
    if (!buenaPractica) return;

    const contexto = buenaPractica.buena_practica_contexto_proposito;

    setForm({
      entorno: contexto?.entorno || "",
      necesidad_problematica: contexto?.necesidad_problematica || "",
      vinculacion_metas: contexto?.vinculacion_metas || "",
      estado_practica: contexto?.estado_practica || "",
      proposito_general: contexto?.proposito_general || "",
      objetivo_central: contexto?.objetivo_central || "",
      poblacion_beneficiaria: contexto?.poblacion_beneficiaria || "",
      condiciones_origen: contexto?.condiciones_origen || "",
    });

    if (Array.isArray(buenaPractica.buena_practica_unidad_participante)) {
      const selected = buenaPractica.buena_practica_unidad_participante
        .map((item) => item.unidad_organizacional)
        .filter(Boolean);

      setUnidadesSeleccionadas(selected);
    } else {
      setUnidadesSeleccionadas([]);
    }

    if (Array.isArray(buenaPractica.buena_practica_linea_tiempo)) {
      setTimelineItems(
        buenaPractica.buena_practica_linea_tiempo.map((item) => ({
          id: item.id,
          fecha: item.fecha ? item.fecha.slice(0, 10) : "",
          nombre: item.nombre || "",
          descripcion: item.descripcion || "",
        }))
      );
    } else {
      setTimelineItems([]);
    }

    setTimelineForm(initialTimelineForm);
  }, [buenaPractica]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  const unidadesDisponibles = useMemo(() => {
    const selectedIds = new Set(unidadesSeleccionadas.map((item) => Number(item.id)));
    const term = unidadSearch.trim().toLowerCase();

    return unidades.filter((unidad) => {
      if (selectedIds.has(Number(unidad.id))) return false;
      if (!term) return true;

      return (
        unidad.nombre?.toLowerCase().includes(term) ||
        unidad.clave?.toLowerCase().includes(term) ||
        unidad.id_institucional?.toLowerCase().includes(term)
      );
    });
  }, [unidades, unidadesSeleccionadas, unidadSearch]);

  function addUnidad(unidad) {
    setUnidadesSeleccionadas((prev) => [...prev, unidad]);
    setUnidadSearch("");
  }

  function removeUnidad(idUnidad) {
    setUnidadesSeleccionadas((prev) =>
      prev.filter((item) => Number(item.id) !== Number(idUnidad))
    );
  }

  function handleTimelineChange(event) {
    const { name, value } = event.target;
    setTimelineForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleAddTimelineItem() {
    if (!timelineForm.fecha || !timelineForm.nombre.trim()) {
      setSaveError("Agrega al menos la fecha y el nombre del antecedente.");
      return;
    }

    setSaveError("");

    setTimelineItems((prev) => [
      ...prev,
      {
        id: `tmp-${Date.now()}`,
        fecha: timelineForm.fecha,
        nombre: timelineForm.nombre.trim(),
        descripcion: timelineForm.descripcion.trim(),
      },
    ]);

    setTimelineForm(initialTimelineForm);
  }

  function handleRemoveTimelineItem(idItem) {
    setTimelineItems((prev) => prev.filter((item) => item.id !== idItem));
  }

  async function saveForm(goNext = false) {
    setSaveError("");
    setSuccess("");

    try {
      setSaving(true);

      await apiFetch(`/api/v1/buenas-practicas/${id}/contexto-proposito`, {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          unidades_participantes: unidadesSeleccionadas.map((item) => Number(item.id)),
          linea_tiempo: timelineItems.map((item) => ({
            fecha: item.fecha,
            nombre: item.nombre,
            descripcion: item.descripcion,
          })),
        }),
      });

      if (goNext) {
        navigate(`/app/ficha/${id}/fundamentacion`);
        return;
      }

      setSuccess(
        "Contexto y propósito guardados correctamente."
      );
    } catch (err) {
      setSaveError(
        err.message || "No fue posible guardar la información de contexto y propósito."
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
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">
          2. Contexto y propósito
        </h2>

        <div className="space-y-1 text-sm leading-6 text-slate-600">
          <p>Descripción del contexto institucional y propósito de la práctica.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Contexto institucional */}
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Contexto institucional
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Describe el entorno, las necesidades identificadas y la vinculación institucional de la práctica.
            </p>
          </div>

          <TextareaField
            label="Describa el entorno que dio lugar a la práctica"
            required
            name="entorno"
            value={form.entorno}
            onChange={handleChange}
            placeholder="Describa las condiciones y características del entorno"
          />

          <TextareaField
            label="¿Qué necesidad o problemática atiende?"
            required
            name="necesidad_problematica"
            value={form.necesidad_problematica}
            onChange={handleChange}
            hint="Especifique la necesidad o problemática identificada."
            placeholder="Explique la necesidad o problemática que motivó esta práctica…"
          />

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                ¿Qué unidad(es) organizacional(es) participaron?{" "}
                <span className="text-red-500">*</span>
              </label>
              <p className="mb-2 text-xs text-slate-500">
                Seleccione las unidades que participaron en la práctica.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={unidadSearch}
                  onChange={(e) => setUnidadSearch(e.target.value)}
                  placeholder="Buscar unidad organizacional..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />

                <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-200">
                  {loadingUnidades ? (
                    <div className="px-4 py-3 text-sm text-slate-500">Cargando...</div>
                  ) : unidadesDisponibles.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-500">
                      No hay unidades disponibles para agregar.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-200">
                      {unidadesDisponibles.slice(0, 5).map((unidad) => (
                        <button
                          key={unidad.id}
                          type="button"
                          onClick={() => addUnidad(unidad)}
                          className="flex w-full items-start justify-between gap-4 px-4 py-3 text-left transition hover:bg-slate-50"
                        >
                          <div>
                            <div className="text-sm font-medium text-slate-800">
                              {unidad.nombre}
                            </div>
                            <div className="text-xs text-slate-500">
                              {unidad.clave || "Sin clave"}{" "}
                              {unidad.id_institucional
                                ? `• ID ${unidad.id_institucional}`
                                : ""}
                            </div>
                          </div>
                          <span className="text-xs font-medium text-slate-500">
                            Agregar
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h4 className="text-sm font-semibold text-slate-800">
                  Unidades participantes
                </h4>
              </div>

              {unidadesSeleccionadas.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-500">
                  No se han agregado unidades participantes aún.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Nombre</th>
                        <th className="px-4 py-3 text-left font-medium">Clave</th>
                        <th className="px-4 py-3 text-left font-medium">
                          ID institucional
                        </th>
                        <th className="px-4 py-3 text-center font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unidadesSeleccionadas.map((unidad) => (
                        <tr key={unidad.id} className="border-t border-slate-200">
                          <td className="px-4 py-3 text-slate-800">{unidad.nombre}</td>
                          <td className="px-4 py-3 text-slate-700">
                            {unidad.clave || "—"}
                          </td>
                          <td className="px-4 py-3 text-slate-700">
                            {unidad.id_institucional || "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => removeUnidad(unidad.id)}
                              className="inline-flex rounded-lg p-2 text-red-600 transition hover:bg-red-50 hover:text-red-700"
                              aria-label="Eliminar unidad"
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
          </div>

          <TextareaField
            label="¿Cómo se vincula con metas del PIDE, POA, SEAES u ODS?"
            required
            name="vinculacion_metas"
            value={form.vinculacion_metas}
            onChange={handleChange}
            hint="Describa la vinculación con instrumentos y metas institucionales."
            placeholder="Explique cómo se vincula con el PIDE, POA, SEAES, ODS u otros…"
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Señalar el estado actual de la práctica{" "}
              <span className="text-red-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">
              Indique el estado de implementación actual.
            </p>
            <select
              name="estado_practica"
              value={form.estado_practica}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              <option value="">Seleccione una opción</option>
              <option value="VIGENTE">Vigente</option>
              <option value="CONCLUIDA">Concluida</option>
              <option value="EN_MEJORA">En mejora</option>
            </select>
          </div>
        </section>

        {/* Propósito */}
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Propósito</h3>
            <p className="mt-1 text-sm text-slate-500">
              Define el sentido, objetivo y población beneficiaria de la buena práctica.
            </p>
          </div>

          <TextareaField
            label="Propósito general de la buena práctica"
            required
            name="proposito_general"
            value={form.proposito_general}
            onChange={handleChange}
            hint="Define el sentido profundo de esta práctica. No pienses en números, sino en el impacto humano o institucional que aspiras lograr a largo plazo y para qué es necesario este cambio."
            placeholder="Ejemplo: Lograr que cada estudiante se sienta escuchado y valorado en un entorno de paz, eliminando las barreras del miedo al error."
          />

          <TextareaField
            label="¿Cuál es el objetivo central?"
            required
            name="objetivo_central"
            value={form.objetivo_central}
            onChange={handleChange}
            hint="Define el resultado principal y medible que articula toda la práctica. Describe qué meta específica se debe cumplir para que este proyecto se considere exitoso y alcanzable."
            placeholder="Ejemplo: Reducir en un 25% los reportes de conflictos escolares en el aula mediante la implementación de círculos de diálogo semanales durante el año escolar."
          />

          <TextareaField
            label="Población beneficiaria"
            required
            name="poblacion_beneficiaria"
            value={form.poblacion_beneficiaria}
            onChange={handleChange}
            placeholder="Ejemplo: Estudiantes de pregrado, docentes, personal administrativo…"
          />

          <TextareaField
            label="Describir brevemente las condiciones que motivaron el desarrollo de la acción y que se considere una buena práctica"
            required
            name="condiciones_origen"
            value={form.condiciones_origen}
            onChange={handleChange}
            hint="Describe el problema o necesidad inicial que motivó esta acción y por qué la solución implementada se considera un modelo a seguir."
            placeholder="Ejemplo: Detectamos una alta deserción escolar por falta de conectividad, lo que exigió una solución innovadora."
          />

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Generar una línea del tiempo (antecedentes)
              </label>
              <p className="mb-2 text-xs text-slate-500">
                Antecedentes que llegaron a consolidar esta propuesta.
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Fecha
                  </label>
                  <input
                    type="date"
                    name="fecha"
                    value={timelineForm.fecha}
                    onChange={handleTimelineChange}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Nombre del antecedente
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={timelineForm.nombre}
                    onChange={handleTimelineChange}
                    placeholder="Nombre del antecedente"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={timelineForm.descripcion}
                  onChange={handleTimelineChange}
                  rows={3}
                  placeholder="Descripción breve del antecedente"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddTimelineItem}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Agregar antecedente
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h4 className="text-sm font-semibold text-slate-800">
                  Línea del tiempo
                </h4>
              </div>

              {timelineItems.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-500">
                  No se han agregado antecedentes aún.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Fecha</th>
                        <th className="px-4 py-3 text-left font-medium">Nombre</th>
                        <th className="px-4 py-3 text-left font-medium">
                          Descripción
                        </th>
                        <th className="px-4 py-3 text-center font-medium">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {timelineItems.map((item) => (
                        <tr key={item.id} className="border-t border-slate-200">
                          <td className="px-4 py-3 text-slate-700">{item.fecha}</td>
                          <td className="px-4 py-3 text-slate-800">{item.nombre}</td>
                          <td className="px-4 py-3 text-slate-700">
                            {item.descripcion || "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveTimelineItem(item.id)}
                              className="inline-flex rounded-lg p-2 text-red-600 transition hover:bg-red-50 hover:text-red-700"
                              aria-label="Eliminar antecedente"
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

function TextareaField({
  label,
  required = false,
  name,
  value,
  onChange,
  hint = "",
  placeholder = "",
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>

      {hint ? <p className="mb-2 text-xs text-slate-500">{hint}</p> : null}

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      />
    </div>
  );
}