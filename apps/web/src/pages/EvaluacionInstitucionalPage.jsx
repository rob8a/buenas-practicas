import { useEffect, useMemo, useState } from "react";
import { Info, X } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { apiFetch } from "../lib/api";
import { useToast } from "../components/feedback/ToastProvider";
import { getUser } from "../lib/auth";

const ESCALA_INSTITUCIONAL = [
  {
    nivel: "ALTO",
    titulo: "Alto",
    descripcion:
      "La práctica muestra evidencia sólida, consolidación y aportación institucional clara.",
    tone: "blue",
  },
  {
    nivel: "MEDIO",
    titulo: "Medio",
    descripcion:
      "La práctica presenta avances y evidencia parcial, con potencial claro de fortalecimiento.",
    tone: "amber",
  },
  {
    nivel: "BAJO",
    titulo: "Bajo",
    descripcion:
      "La práctica presenta evidencia insuficiente o débil vinculación con los fines institucionales.",
    tone: "red",
  },
];

export default function EvaluacionInstitucionalPage() {
  const toast = useToast();
  const user = getUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [buenaPractica, setBuenaPractica] = useState(null);
  const [evaluacion, setEvaluacion] = useState(null);
  const [criterios, setCriterios] = useState([]);
  const [observacionesAdicionales, setObservacionesAdicionales] = useState("");
  const [criterioModal, setCriterioModal] = useState(null);

  // Temporal para pruebas
  const buenaPracticaId = 1;

  useEffect(() => {
    loadEvaluacionInstitucional();
  }, []);

  async function loadEvaluacionInstitucional() {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(
        `/api/v1/buenas-practicas/${buenaPracticaId}/evaluacion-institucional`
      );

      const data = response.data;

      setBuenaPractica({
        id: data?.buena_practica_id,
        titulo: data?.titulo_buena_practica || `Buena práctica #${buenaPracticaId}`,
        estatus: data?.estatus || null,
      });

      setEvaluacion(data?.evaluacion_institucional || null);
      setObservacionesAdicionales(
        data?.evaluacion_institucional?.observaciones_adicionales || ""
      );

      setCriterios(
        (data?.respuestas || []).map((item) => ({
          catalogo_evaluacion_institucional_criterio_id:
            item.catalogo_evaluacion_institucional_criterio_id,
          clave: item.clave,
          nombre: item.nombre,
          descripcion: item.descripcion,
          orden: item.orden,
          nivel: item.nivel,
          justificacion: item.justificacion || "",
          rubricas: item.rubricas || [],
        }))
      );
    } catch (err) {
      setError(err.message || "No se pudo cargar la evaluación institucional.");
    } finally {
      setLoading(false);
    }
  }

  const canEdit = useMemo(() => {
    const clave = buenaPractica?.estatus?.clave;
    return (
      clave === "EVALUACION_INSTITUCIONAL" ||
      clave === "EVALUACION_INSTITUCIONAL_RECHAZADA"
    );
  }, [buenaPractica]);

  const metricas = useMemo(() => {
    let puntajeTotal = 0;
    let puntajeMaximo = criterios.length * 3;
    let criteriosEvaluados = 0;
    let criteriosCompletos = 0;

    for (const criterio of criterios) {
      if (criterio.nivel) {
        criteriosEvaluados += 1;
        puntajeTotal += mapNivelToScore(criterio.nivel);
      }

      if (criterio.nivel && criterio.justificacion.trim()) {
        criteriosCompletos += 1;
      }
    }

    const promedio =
      puntajeMaximo > 0 ? Number((puntajeTotal / puntajeMaximo).toFixed(4)) : 0;

    const porcentajeLogro =
      puntajeMaximo > 0
        ? Number(((puntajeTotal / puntajeMaximo) * 100).toFixed(1))
        : 0;

    const sugerencia = getSugerencia(puntajeTotal);

    return {
      puntajeTotal,
      puntajeMaximo,
      promedio,
      porcentajeLogro,
      criteriosEvaluados,
      criteriosCompletos,
      sugerencia,
    };
  }, [criterios]);

  function handleNivelChange(criterioId, nivel) {
    if (!canEdit) return;

    setCriterios((prev) =>
      prev.map((item) =>
        item.catalogo_evaluacion_institucional_criterio_id === criterioId
          ? { ...item, nivel }
          : item
      )
    );
  }

  function handleJustificacionChange(criterioId, value) {
    if (!canEdit) return;

    setCriterios((prev) =>
      prev.map((item) =>
        item.catalogo_evaluacion_institucional_criterio_id === criterioId
          ? { ...item, justificacion: value }
          : item
      )
    );
  }

  async function handleGuardar() {
    if (!canEdit) return;

    try {
      setSaving(true);

      const response = await apiFetch(
        `/api/v1/buenas-practicas/${buenaPracticaId}/evaluacion-institucional`,
        {
          method: "PATCH",
          body: JSON.stringify({
            evaluado_por_id: user?.id,
            observaciones_adicionales: observacionesAdicionales,
            respuestas: criterios.map((item) => ({
              catalogo_evaluacion_institucional_criterio_id:
                item.catalogo_evaluacion_institucional_criterio_id,
              nivel: item.nivel,
              justificacion: item.justificacion,
            })),
          }),
        }
      );

      setEvaluacion(response.data?.evaluacion_institucional || null);

      toast.success(
        "La evaluación institucional se guardó correctamente.",
        "Guardado exitoso"
      );
    } catch (err) {
      toast.error(
        err.message || "No fue posible guardar la evaluación institucional.",
        "Error al guardar"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleReconocer() {
    if (!canEdit) return;

    if (metricas.criteriosCompletos !== criterios.length) {
      toast.warning(
        "Completa todos los criterios con nivel y justificación antes de emitir el dictamen.",
        "Evaluación incompleta"
      );
      return;
    }

    if (!observacionesAdicionales.trim()) {
      toast.warning(
        "Agrega observaciones adicionales antes de emitir el dictamen.",
        "Observaciones requeridas"
      );
      return;
    }

    try {
      setSending(true);

      await apiFetch(
        `/api/v1/buenas-practicas/${buenaPracticaId}/evaluacion-institucional/dictaminar`,
        {
          method: "POST",
          body: JSON.stringify({
            dictamen: "RECONOCIDA",
            evaluado_por_id: user?.id,
            observaciones_adicionales: observacionesAdicionales,
          }),
        }
      );

      toast.success(
        "La práctica fue reconocida como Buena Práctica institucional.",
        "Dictamen registrado"
      );

      await loadEvaluacionInstitucional();
    } catch (err) {
      toast.error(
        err.message || "No fue posible emitir el dictamen institucional.",
        "Error al dictaminar"
      );
    } finally {
      setSending(false);
    }
  }

  async function handleNoReconocer() {
    if (!canEdit) return;

    if (!observacionesAdicionales.trim()) {
      toast.warning(
        "Agrega observaciones adicionales antes de emitir el dictamen.",
        "Observaciones requeridas"
      );
      return;
    }

    try {
      setSending(true);

      await apiFetch(
        `/api/v1/buenas-practicas/${buenaPracticaId}/evaluacion-institucional/dictaminar`,
        {
          method: "POST",
          body: JSON.stringify({
            dictamen: "NO_RECONOCIDA",
            evaluado_por_id: user?.id,
            observaciones_adicionales: observacionesAdicionales,
          }),
        }
      );

      toast.success(
        "La práctica no fue reconocida y se registró el dictamen institucional.",
        "Dictamen registrado"
      );

      await loadEvaluacionInstitucional();
    } catch (err) {
      toast.error(
        err.message || "No fue posible emitir el dictamen institucional.",
        "Error al dictaminar"
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <AppShell title="Evaluación institucional">
        <div className="p-6 text-sm text-slate-600">
          Cargando evaluación institucional...
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Evaluación institucional">
        <div className="p-6">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Evaluación institucional">
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Evaluación institucional
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Gestión y seguimiento de buenas prácticas institucionales.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Acciones de consulta
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Revisa la ficha completa de la buena práctica antes de emitir el dictamen institucional.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() =>
                  window.open(
                    `/app/ficha/${buenaPracticaId}/resumen`,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Ver ficha
              </button>

              <button
                type="button"
                onClick={() =>
                  toast.info(
                    "La descarga PDF de la ficha se conectará sobre la vista resumen.",
                    "Descarga pendiente"
                  )
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Descargar PDF
              </button>
            </div>
          </div>
        </section>

        {!canEdit ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            La evaluación institucional se encuentra en una etapa de revisión y actualmente no permite edición.
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Información general
              </h2>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FieldReadOnly
                  label="Título de la buena práctica"
                  value={buenaPractica?.titulo}
                />
                <FieldReadOnly
                  label="Nombre del evaluador"
                  value={
                    user?.nombre
                      ? `${user.nombre} ${user.apellidoPaterno || ""}`.trim()
                      : "Sin especificar"
                  }
                />
              </div>

              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
                Revisar la evidencia que se expresa en la ficha de sistematización de buena práctica,
                así como en la rúbrica de evaluación final. Asignar el nivel alcanzado y registrar
                la justificación correspondiente.
              </div>
            </section>

            <section className="space-y-4">
              {criterios.map((criterio) => {
                const criterioCompleto =
                  criterio.nivel !== null &&
                  criterio.nivel !== undefined &&
                  criterio.nivel !== "" &&
                  criterio.justificacion.trim();

                return (
                  <article
                    key={criterio.catalogo_evaluacion_institucional_criterio_id}
                    className={[
                      "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md",
                      !criterioCompleto && canEdit ? "ring-1 ring-amber-200" : "",
                    ].join(" ")}
                  >
                    <div className="space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            Criterio {criterio.orden}
                          </span>

                          <p className="mt-3 font-semibold text-slate-900">
                            {criterio.nombre}
                          </p>

                          <p className="mt-1 text-sm text-slate-500">
                            {criterio.descripcion}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCriterioModal(criterio)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-blue-200 bg-blue-50 text-blue-700 transition hover:bg-blue-100"
                            title="Ver rúbrica"
                          >
                            <Info size={16} />
                          </button>

                          <span
                            className={[
                              "inline-flex rounded-full px-3 py-1 text-xs font-medium",
                              criterioCompleto
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700",
                            ].join(" ")}
                          >
                            {criterioCompleto ? "Completo" : "Pendiente"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-medium text-slate-700">
                          Nivel
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {["ALTO", "MEDIO", "BAJO"].map((nivel) => {
                            const selected = criterio.nivel === nivel;

                            return (
                              <button
                                key={nivel}
                                type="button"
                                disabled={!canEdit}
                                onClick={() =>
                                  handleNivelChange(
                                    criterio.catalogo_evaluacion_institucional_criterio_id,
                                    nivel
                                  )
                                }
                                className={[
                                  "rounded-xl border px-4 py-2 text-sm font-medium transition",
                                  selected
                                    ? "border-slate-900 bg-slate-900 text-white"
                                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                                  !canEdit ? "cursor-default opacity-80" : "",
                                ].join(" ")}
                              >
                                {nivel}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-medium text-slate-700">
                          Justificación
                        </p>

                        <textarea
                          value={criterio.justificacion}
                          onChange={(e) =>
                            handleJustificacionChange(
                              criterio.catalogo_evaluacion_institucional_criterio_id,
                              e.target.value
                            )
                          }
                          readOnly={!canEdit}
                          rows={4}
                          placeholder="Argumente el nivel asignado con base en la evidencia disponible..."
                          className={[
                            "w-full rounded-xl px-4 py-3 outline-none transition",
                            !canEdit
                              ? "border border-slate-200 bg-slate-50 text-slate-800"
                              : "border border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
                          ].join(" ")}
                        />
                      </div>
                    </div>
                  </article>
                );
              })}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Guardado de evaluación
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Guarda avances si la evaluación se realiza en varias sesiones.
                  </p>
                </div>

                {canEdit ? (
                  <button
                    type="button"
                    onClick={handleGuardar}
                    disabled={saving}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {saving ? "Guardando..." : "Guardar evaluación"}
                  </button>
                ) : null}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Dictamen institucional
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Emite el resultado final de la evaluación institucional.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-medium text-slate-700">
                    Sugerencia automática del sistema
                  </p>

                  <div
                    className={[
                      "mt-3 inline-flex rounded-full border px-3 py-1 text-sm font-medium",
                      getSuggestionTone(metricas.sugerencia.clave),
                    ].join(" ")}
                  >
                    {metricas.sugerencia.label}
                  </div>

                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    Esta sugerencia se calcula automáticamente con base en los niveles asignados.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Observaciones adicionales
                  </label>

                  <textarea
                    value={observacionesAdicionales}
                    onChange={(e) => setObservacionesAdicionales(e.target.value)}
                    readOnly={!canEdit}
                    rows={5}
                    placeholder="Registre observaciones adicionales que sustenten el dictamen institucional..."
                    className={[
                      "w-full rounded-xl px-4 py-3 outline-none transition",
                      !canEdit
                        ? "border border-slate-200 bg-slate-50 text-slate-800"
                        : "border border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
                    ].join(" ")}
                  />
                </div>

                {canEdit ? (
                  <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={handleNoReconocer}
                      disabled={sending}
                      className="rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {sending ? "Procesando..." : "No reconocer"}
                    </button>

                    <button
                      type="button"
                      onClick={handleReconocer}
                      disabled={sending}
                      className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {sending ? "Procesando..." : "Reconocer práctica"}
                    </button>
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Resumen de evaluación
              </h3>

              <div className="mt-5 space-y-4 text-sm">
                <MetricRow
                  label="Puntaje total"
                  value={`${metricas.puntajeTotal} / ${metricas.puntajeMaximo}`}
                />
                <MetricRow
                  label="Promedio"
                  value={metricas.promedio.toFixed(2)}
                />
                <MetricRow
                  label="Criterios evaluados"
                  value={`${metricas.criteriosEvaluados} / ${criterios.length}`}
                />
                <MetricRow
                  label="Porcentaje de logro"
                  value={`${metricas.porcentajeLogro}%`}
                />
              </div>

              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900"
                  style={{
                    width: `${
                      metricas.puntajeMaximo > 0
                        ? (metricas.puntajeTotal / metricas.puntajeMaximo) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <div
                className={[
                  "mt-4 rounded-xl border px-4 py-3 text-sm font-medium",
                  getSuggestionTone(metricas.sugerencia.clave),
                ].join(" ")}
              >
                {metricas.sugerencia.label}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Escala de referencia
              </h3>

              <div className="mt-4 space-y-3">
                {ESCALA_INSTITUCIONAL.map((item) => (
                  <div key={item.nivel} className="flex gap-3">
                    <span
                      className={[
                        "inline-flex min-w-[72px] justify-center rounded-full border px-3 py-1 text-xs font-semibold",
                        getInstitutionalScaleTone(item.tone),
                      ].join(" ")}
                    >
                      {item.titulo}
                    </span>

                    <p className="text-xs leading-5 text-slate-600">
                      {item.descripcion}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {criterioModal ? (
        <CriterioInstitucionalModal
          criterio={criterioModal}
          onClose={() => setCriterioModal(null)}
        />
      ) : null}
    </AppShell>
  );
}

function FieldReadOnly({ label, value }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
        {value || "Sin especificar"}
      </div>
    </div>
  );
}

function MetricRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="font-semibold text-slate-900">{value}</span>
    </div>
  );
}

function CriterioInstitucionalModal({ criterio, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/35"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <div className="relative z-10 w-full max-w-4xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {criterio.nombre}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {criterio.descripcion}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
            aria-label="Cerrar"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-6 py-6">
          <div className="grid gap-4 md:grid-cols-3">
            {["ALTO", "MEDIO", "BAJO"].map((nivel) => {
              const rubrica = (criterio.rubricas || []).find(
                (item) => item.nivel === nivel
              );

              return (
                <div
                  key={nivel}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <span
                    className={[
                      "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                      getInstitutionalPillTone(nivel),
                    ].join(" ")}
                  >
                    {nivel}
                  </span>

                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    {rubrica?.descripcion || "Sin descripción"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}

function mapNivelToScore(nivel) {
  switch (String(nivel)) {
    case "ALTO":
      return 3;
    case "MEDIO":
      return 2;
    case "BAJO":
    default:
      return 1;
  }
}

function getSugerencia(puntajeTotal) {
  if (puntajeTotal >= 10) {
    return {
      clave: "RECONOCIDA",
      label: "Sugerencia: reconocer la práctica",
    };
  }

  if (puntajeTotal >= 7) {
    return {
      clave: "REVISAR_CON_RESERVAS",
      label: "Sugerencia: revisar con reservas",
    };
  }

  return {
    clave: "NO_RECONOCIDA",
    label: "Sugerencia: no reconocer la práctica",
  };
}

function getSuggestionTone(clave) {
  switch (clave) {
    case "RECONOCIDA":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REVISAR_CON_RESERVAS":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "NO_RECONOCIDA":
    default:
      return "border-red-200 bg-red-50 text-red-700";
  }
}

function getInstitutionalScaleTone(tone) {
  switch (tone) {
    case "blue":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "red":
    default:
      return "border-red-200 bg-red-50 text-red-700";
  }
}

function getInstitutionalPillTone(nivel) {
  switch (nivel) {
    case "ALTO":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "MEDIO":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "BAJO":
    default:
      return "border-red-200 bg-red-50 text-red-700";
  }
}