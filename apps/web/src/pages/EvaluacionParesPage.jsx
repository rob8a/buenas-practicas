import { useEffect, useMemo, useState } from "react";
import { Info, X } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { apiFetch } from "../lib/api";
import { useToast } from "../components/feedback/ToastProvider";
import { getUser } from "../lib/auth";

const ESCALA_TRANSVERSAL = [
  {
    nivel: 4,
    titulo: "Alto",
    descripcion:
      "Evidencia sólida, impacto sostenido (≥ 2 ciclos); mejora demostrada; procesos estandarizados; documentación completa.",
    tone: "blue",
  },
  {
    nivel: 3,
    titulo: "Medio",
    descripcion:
      "Evidencia parcial, avances claros (indicadores definidos con resultados consistentes; mejora observable en el último ciclo).",
    tone: "slate",
  },
  {
    nivel: 2,
    titulo: "Básico",
    descripcion:
      "Evidencia débil, resultados limitados (datos descriptivos sin comparación; mejoras puntuales; documentación incompleta).",
    tone: "amber",
  },
  {
    nivel: 1,
    titulo: "Insuficiente",
    descripcion:
      "Sin evidencia o no alineado (afirmaciones sin respaldo; acciones aisladas; incoherencia con el criterio).",
    tone: "red",
  },
];

export default function EvaluacionParesPage() {
  const toast = useToast();
  const user = getUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [buenaPractica, setBuenaPractica] = useState(null);
  const [evaluacion, setEvaluacion] = useState(null);
  const [criterios, setCriterios] = useState([]);
  const [observacionesClave, setObservacionesClave] = useState("");
  const [criterioModal, setCriterioModal] = useState(null);

  // TODO temporal: cambia por selección real
  const buenaPracticaId = 1;

  useEffect(() => {
    loadEvaluacionPares();
  }, []);

  async function loadEvaluacionPares() {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(
        `/api/v1/buenas-practicas/${buenaPracticaId}/evaluacion-pares`
      );

      const data = response.data;

      setBuenaPractica({
        id: data?.buena_practica_id,
        estatus: data?.estatus || null,
      });

      setEvaluacion(data?.evaluacion_pares || null);
      setObservacionesClave(data?.evaluacion_pares?.observaciones_clave || "");

      setCriterios(
        (data?.respuestas || []).map((item) => ({
          catalogo_evaluacion_pares_criterio_id:
            item.catalogo_evaluacion_pares_criterio_id,
          clave: item.clave,
          nombre: item.nombre,
          descripcion: item.descripcion,
          es_critico: item.es_critico,
          orden: item.orden,
          nivel: item.nivel,
          justificacion: item.justificacion || "",
          rubricas: item.rubricas || [],
        }))
      );
    } catch (err) {
      setError(err.message || "No se pudo cargar la evaluación de pares.");
    } finally {
      setLoading(false);
    }
  }

  const canEdit = useMemo(() => {
    const clave = buenaPractica?.estatus?.clave;
    return (
      clave === "EVALUACION_PARES" ||
      clave === "EVALUACION_PARES_RECHAZADA"
    );
  }, [buenaPractica]);

  const metricas = useMemo(() => {
    let puntajeTotalValido = 0;
    let puntajeMaximoValido = 0;
    let criteriosEvaluados = 0;
    let criteriosCompletos = 0;
    let tieneCriticoEnUno = false;

    for (const criterio of criterios) {
      const nivel = criterio.nivel;
      const justificacion = criterio.justificacion?.trim();

      if (nivel !== null && nivel !== undefined && nivel !== "") {
        criteriosEvaluados += 1;
      }

      if (
        nivel !== null &&
        nivel !== undefined &&
        nivel !== "" &&
        justificacion
      ) {
        criteriosCompletos += 1;
      }

      if (nivel && nivel !== "NA") {
        const numeric = Number(nivel);
        puntajeTotalValido += numeric;
        puntajeMaximoValido += 4;

        if (criterio.es_critico && numeric === 1) {
          tieneCriticoEnUno = true;
        }
      }
    }

    const promedio =
      puntajeMaximoValido > 0
        ? Number((puntajeTotalValido / puntajeMaximoValido).toFixed(4))
        : 0;

    const porcentajeLogro =
      puntajeMaximoValido > 0
        ? Number(
            ((puntajeTotalValido / puntajeMaximoValido) * 100).toFixed(1)
          )
        : 0;

    const recomendacion = getRecomendacionEvaluacionPares({
      puntajeTotalValido,
      tieneCriticoEnUno,
    });

    return {
      puntajeTotalValido,
      puntajeMaximoValido,
      promedio,
      porcentajeLogro,
      criteriosEvaluados,
      criteriosCompletos,
      tieneCriticoEnUno,
      recomendacion,
    };
  }, [criterios]);

  function handleNivelChange(criterioId, nivel) {
    if (!canEdit) return;

    setCriterios((prev) =>
      prev.map((item) =>
        item.catalogo_evaluacion_pares_criterio_id === criterioId
          ? { ...item, nivel }
          : item
      )
    );
  }

  function handleJustificacionChange(criterioId, value) {
    if (!canEdit) return;

    setCriterios((prev) =>
      prev.map((item) =>
        item.catalogo_evaluacion_pares_criterio_id === criterioId
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
        `/api/v1/buenas-practicas/${buenaPracticaId}/evaluacion-pares`,
        {
          method: "PATCH",
          body: JSON.stringify({
            evaluado_por_id: user?.id,
            observaciones_clave: observacionesClave,
            respuestas: criterios.map((item) => ({
              catalogo_evaluacion_pares_criterio_id:
                item.catalogo_evaluacion_pares_criterio_id,
              nivel: item.nivel,
              justificacion: item.justificacion,
            })),
          }),
        }
      );

      setEvaluacion(response.data?.evaluacion_pares || null);

      toast.success(
        "La evaluación de pares se guardó correctamente.",
        "Guardado exitoso"
      );
    } catch (err) {
      toast.error(
        err.message || "No fue posible guardar la evaluación de pares.",
        "Error al guardar"
      );
    } finally {
      setSaving(false);
    }
  }


    async function handleAceptar() {
    if (!canEdit) return;

    if (metricas.criteriosCompletos !== criterios.length) {
        toast.warning(
        "Completa todos los criterios con calificación y justificación antes de emitir el dictamen.",
        "Evaluación incompleta"
        );
        return;
    }

    if (metricas.recomendacion.clave === "NO_AVANZAR") {
        toast.warning(
        "La evaluación actual no cumple las condiciones para aceptarse.",
        "No es posible aceptar"
        );
        return;
    }

    if (!observacionesClave.trim()) {
        toast.warning(
        "Agrega observaciones del dictamen antes de aceptar la evaluación.",
        "Observaciones requeridas"
        );
        return;
    }

    try {
        setSending(true);

        await apiFetch(
        `/api/v1/buenas-practicas/${buenaPracticaId}/evaluacion-pares/dictaminar`,
        {
            method: "POST",
            body: JSON.stringify({
            dictamen: "ACEPTADA",
            evaluado_por_id: user?.id,
            observaciones_clave: observacionesClave,
            }),
        }
        );

        toast.success(
        "La evaluación de pares fue aceptada y la buena práctica avanzó a evaluación institucional.",
        "Dictamen registrado"
        );

        await loadEvaluacionPares();
    } catch (err) {
        toast.error(
        err.message || "No fue posible aceptar la evaluación de pares.",
        "Error al dictaminar"
        );
    } finally {
        setSending(false);
    }
    }

    async function handleRechazar() {
    if (!canEdit) return;

    if (!observacionesClave.trim()) {
        toast.warning(
        "Agrega observaciones del dictamen antes de rechazar la evaluación.",
        "Observaciones requeridas"
        );
        return;
    }

    try {
        setSending(true);

        await apiFetch(
        `/api/v1/buenas-practicas/${buenaPracticaId}/evaluacion-pares/dictaminar`,
        {
            method: "POST",
            body: JSON.stringify({
            dictamen: "RECHAZADA",
            evaluado_por_id: user?.id,
            observaciones_clave: observacionesClave,
            }),
        }
        );

        toast.success(
        "La evaluación de pares fue rechazada y la buena práctica fue devuelta para corrección.",
        "Dictamen registrado"
        );

        await loadEvaluacionPares();
    } catch (err) {
        toast.error(
        err.message || "No fue posible rechazar la evaluación de pares.",
        "Error al dictaminar"
        );
    } finally {
        setSending(false);
    }
    }

  if (loading) {
    return (
      <AppShell title="Evaluación de pares">
        <div className="p-6 text-sm text-slate-600">
          Cargando evaluación de pares...
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Evaluación de pares">
        <div className="p-6">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Evaluación de pares">
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Evaluación de pares
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Gestión y seguimiento de buenas prácticas institucionales.
          </p>
        </div>

        {!canEdit ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            La evaluación de pares se encuentra en una etapa de revisión y actualmente no permite edición.
          </div>
        ) : null}
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
            <h2 className="text-lg font-semibold text-slate-900">
                Acciones de consulta
            </h2>
            <p className="mt-1 text-sm text-slate-500">
                Revisa la ficha completa de la buena práctica antes de emitir el dictamen.
            </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
            <button
                type="button"
                onClick={() =>
                window.open(`/app/ficha/${buenaPracticaId}/resumen`, "_blank", "noopener,noreferrer")
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
                Ver ficha
            </button>

            <button
                type="button"
                onClick={() =>
                toast.info(
                    "El siguiente paso es conectar la vista de solo lectura y la exportación PDF de la ficha.",
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
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* principal */}
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Información general
              </h2>

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <FieldReadOnly
                  label="Título de la buena práctica"
                  value={evaluacion?.titulo_buena_practica || `Buena práctica #${buenaPracticaId}`}
                />

                <FieldReadOnly
                  label="Nombre del evaluador"
                  value={user?.nombre ? `${user.nombre} ${user.apellidoPaterno || ""}`.trim() : "Sin especificar"}
                />
              </div>

              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800">
                <p>
                  Nota: Para los criterios <strong>Equidad social y de género</strong>,{" "}
                  <strong>Inclusión</strong>, <strong>Cultura de paz</strong>,{" "}
                  <strong>Medio ambiente y sustentabilidad</strong> no podrán quedar en nivel 1 o N/A; si esto ocurre la recomendación será de no avanzar con la buena práctica.
                </p>
                <p className="mt-2">
                  Seleccionar <strong>N/A</strong> si el criterio no aplica al contexto y justificar por qué. Los N/A no contabilizan en el denominador al calcular el puntaje final.
                </p>
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
                    key={criterio.catalogo_evaluacion_pares_criterio_id}
                    className={[
                      "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md",
                      !criterioCompleto && canEdit ? "ring-1 ring-amber-200" : "",
                    ].join(" ")}
                  >
                    <div className="space-y-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                              Criterio {criterio.orden}
                            </span>

                            {criterio.es_critico ? (
                              <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                                Crítico
                              </span>
                            ) : null}
                          </div>

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
                            {criterioCompleto ? "Completo" : "Sin calificar"}
                          </span>
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-sm font-medium text-slate-700">
                          Calificación
                        </p>

                        <div className="flex flex-wrap gap-2">
                          {["4", "3", "2", "1", "NA"].map((nivel) => {
                            const selected = criterio.nivel === nivel;

                            return (
                              <button
                                key={nivel}
                                type="button"
                                disabled={!canEdit}
                                onClick={() =>
                                  handleNivelChange(
                                    criterio.catalogo_evaluacion_pares_criterio_id,
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
                              criterio.catalogo_evaluacion_pares_criterio_id,
                              e.target.value
                            )
                          }
                          readOnly={!canEdit}
                          rows={4}
                          placeholder="Argumente la calificación asignada..."
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
              <h2 className="text-lg font-semibold text-slate-900">
                Comentarios generales
              </h2>

              <textarea
                value={observacionesClave}
                onChange={(e) => setObservacionesClave(e.target.value)}
                readOnly={!canEdit}
                rows={5}
                placeholder="Registre observaciones clave, recomendaciones o hallazgos relevantes de la evaluación..."
                className={[
                  "mt-4 w-full rounded-xl px-4 py-3 outline-none transition",
                  !canEdit
                    ? "border border-slate-200 bg-slate-50 text-slate-800"
                    : "border border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200",
                ].join(" ")}
              />
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
                    Dictamen de evaluación de pares
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                    Emite el resultado final de la evaluación. Esta acción ya representa un dictamen, no solo un guardado parcial.
                </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">
                    Recomendación automática del sistema
                </p>

                <div
                    className={[
                    "mt-3 inline-flex rounded-full border px-3 py-1 text-sm font-medium",
                    getRecommendationTone(metricas.recomendacion.clave),
                    ].join(" ")}
                >
                    {metricas.recomendacion.label}
                </div>

                <p className="mt-3 text-xs leading-5 text-slate-500">
                    Esta recomendación se calcula automáticamente con base en el puntaje total
                    y en la validación de criterios críticos.
                </p>
                </div>

                <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                    Observaciones del dictamen
                </label>

                <textarea
                    value={observacionesClave}
                    onChange={(e) => setObservacionesClave(e.target.value)}
                    readOnly={!canEdit}
                    rows={5}
                    placeholder="Registre observaciones, condiciones, fortalezas, áreas de mejora o justificación del dictamen..."
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
                    onClick={handleRechazar}
                    disabled={sending}
                    className="rounded-xl border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                    {sending ? "Procesando..." : "Rechazar evaluación"}
                    </button>

                    <button
                    type="button"
                    onClick={handleAceptar}
                    disabled={sending}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                    {sending ? "Procesando..." : "Aceptar evaluación"}
                    </button>
                </div>
                ) : null}
            </div>
            </section>

          </div>

          {/* lateral */}
          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Resumen de evaluación
              </h3>

              <div className="mt-5 space-y-4 text-sm">
                <MetricRow
                  label="Puntuación promedio"
                  value={metricas.promedio.toFixed(2)}
                />
                <MetricRow
                  label="Puntuación total"
                  value={`${metricas.puntajeTotalValido} / ${metricas.puntajeMaximoValido}`}
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
                      metricas.puntajeMaximoValido > 0
                        ? (metricas.puntajeTotalValido /
                            metricas.puntajeMaximoValido) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>

              <div
                className={[
                  "mt-4 rounded-xl border px-4 py-3 text-sm font-medium",
                  getRecommendationTone(metricas.recomendacion.clave),
                ].join(" ")}
              >
                {metricas.recomendacion.label}
              </div>

              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <span className="font-medium text-slate-900">Estado del dictamen:</span>{" "}
                {canEdit ? "Pendiente de emitir" : "Emitido o en revisión"}
            </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Escala de referencia
              </h3>

              <div className="mt-4 space-y-3">
                {ESCALA_TRANSVERSAL.map((item) => (
                  <div key={item.nivel} className="flex gap-3">
                    <span
                      className={[
                        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
                        getScaleTone(item.tone),
                      ].join(" ")}
                    >
                      {item.nivel}
                    </span>

                    <div>
                      <p className="font-semibold text-slate-900">
                        {item.titulo}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        {item.descripcion}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {criterioModal ? (
        <CriterioRubricaModal
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

function CriterioRubricaModal({ criterio, onClose }) {
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
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <h4 className="text-sm font-semibold text-slate-900">
            Rúbrica del criterio
            </h4>

            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[4, 3, 2, 1].map((nivel) => {
                const rubrica = (criterio.rubricas || []).find(
                (item) => Number(item.nivel) === nivel
                );

                return (
                <div
                    key={nivel}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                >
                    <span
                    className={[
                        "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                        getScaleTone(
                        nivel === 4
                            ? "blue"
                            : nivel === 3
                            ? "slate"
                            : nivel === 2
                            ? "amber"
                            : "red"
                        ),
                    ].join(" ")}
                    >
                    {nivel} {getLevelTitle(nivel)}
                    </span>

                    <p className="mt-3 text-sm leading-6 text-slate-700">
                    {rubrica?.descripcion || "Sin descripción"}
                    </p>
                </div>
                );
            })}
            </div>
        </section>
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

function getRecomendacionEvaluacionPares({ puntajeTotalValido, tieneCriticoEnUno }) {
  if (tieneCriticoEnUno) {
    return {
      clave: "NO_AVANZAR",
      label: "No avanzar; requiere fortalecimiento",
    };
  }

  if (puntajeTotalValido >= 34) {
    return {
      clave: "RECONOCER_BUENA_PRACTICA",
      label: "Reconocer como Buena Práctica",
    };
  }

  if (puntajeTotalValido >= 26) {
    return {
      clave: "AVANZAR_MEJORAS_MENORES",
      label: "Avanzar con mejoras menores",
    };
  }

  if (puntajeTotalValido >= 18) {
    return {
      clave: "REQUIERE_FORTALECIMIENTO",
      label: "Requiere fortalecimiento y re-evaluación",
    };
  }

  return {
    clave: "NO_AVANZAR",
    label: "No avanzar; requiere fortalecimiento",
  };
}

function getScaleTone(tone) {
  switch (tone) {
    case "blue":
      return "border-sky-200 bg-sky-50 text-sky-700";
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "red":
      return "border-red-200 bg-red-50 text-red-700";
    case "slate":
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getRecommendationTone(clave) {
  switch (clave) {
    case "RECONOCER_BUENA_PRACTICA":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "AVANZAR_MEJORAS_MENORES":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "REQUIERE_FORTALECIMIENTO":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "NO_AVANZAR":
    default:
      return "border-red-200 bg-red-50 text-red-700";
  }
}

function getLevelTitle(nivel) {
  switch (nivel) {
    case 4:
      return "Alto";
    case 3:
      return "Medio";
    case 2:
      return "Básico";
    case 1:
    default:
      return "Insuficiente";
  }
}