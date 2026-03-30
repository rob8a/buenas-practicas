import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import AppShell from "../components/layout/AppShell";
import { apiFetch } from "../lib/api";
import { useToast } from "../components/feedback/ToastProvider";
import { getUser } from "../lib/auth";

export default function AutoevaluacionPage() {
  const toast = useToast();
  const user = getUser();


  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [buenaPractica, setBuenaPractica] = useState(null);
  const [autoevaluacion, setAutoevaluacion] = useState(null);
  const [criterios, setCriterios] = useState([]);

  // TODO temporal: cambia por selección real desde listado/flujo
  const buenaPracticaId = 1;

  useEffect(() => {
    loadAutoevaluacion();
  }, []);

  async function loadAutoevaluacion() {
    try {
      setLoading(true);
      setError("");

      const response = await apiFetch(
        `/api/v1/buenas-practicas/${buenaPracticaId}/autoevaluacion`
      );

      setBuenaPractica({
        id: response.data?.buena_practica_id,
        estatus: response.data?.estatus || null,
      });

      setAutoevaluacion(response.data?.autoevaluacion || null);

      setCriterios(
        (response.data?.respuestas || []).map((item) => ({
          catalogo_autoevaluacion_criterio_id:
            item.catalogo_autoevaluacion_criterio_id,
          clave: item.clave,
          nombre: item.nombre,
          descripcion: item.descripcion,
          orden: item.orden,
          nivel: item.nivel,
          justificacion: item.justificacion || "",
        }))
      );
    } catch (err) {
      setError(err.message || "No se pudo cargar la autoevaluación.");
    } finally {
      setLoading(false);
    }
  }

  const canEdit = useMemo(() => {
    const clave = buenaPractica?.estatus?.clave;
    return (
      clave === "AUTOEVALUACION" || clave === "AUTOEVALUACION_RECHAZADA"
    );
  }, [buenaPractica]);

  const puntajeTotal = useMemo(() => {
    return criterios.reduce((acc, item) => {
      if (item.nivel === null || item.nivel === undefined) return acc;
      return acc + Number(item.nivel);
    }, 0);
  }, [criterios]);

  const interpretacion = useMemo(() => {
    if (puntajeTotal >= 16) {
      return {
        clave: "PRACTICA_LISTA",
        label: "Práctica lista para enviar.",
        tone: "emerald",
      };
    }

    if (puntajeTotal >= 12) {
      return {
        clave: "AJUSTES_MENORES",
        label: "Requiere ajustes menores.",
        tone: "blue",
      };
    }

    return {
      clave: "REVISION_INTERNA",
      label: "Revisión interna necesaria antes de someterla a evaluación.",
      tone: "amber",
    };
  }, [puntajeTotal]);

  const criteriosCompletos = useMemo(() => {
    return criterios.filter(
      (item) =>
        item.nivel !== null &&
        item.nivel !== undefined &&
        item.justificacion.trim()
    ).length;
  }, [criterios]);

  function handleNivelChange(criterioId, nivel) {
    if (!canEdit) return;

    setCriterios((prev) =>
      prev.map((item) =>
        item.catalogo_autoevaluacion_criterio_id === criterioId
          ? { ...item, nivel }
          : item
      )
    );
  }

  function handleJustificacionChange(criterioId, value) {
    if (!canEdit) return;

    setCriterios((prev) =>
      prev.map((item) =>
        item.catalogo_autoevaluacion_criterio_id === criterioId
          ? { ...item, justificacion: value }
          : item
      )
    );
  }

  async function handleGuardar() {
    if (!canEdit) return;

    try {
      setSaving(true);

      const payload = {
        evaluado_por_id: user?.id,
        respuestas: criterios.map((item) => ({
          catalogo_autoevaluacion_criterio_id:
            item.catalogo_autoevaluacion_criterio_id,
          nivel: item.nivel,
          justificacion: item.justificacion,
        })),
      };

      const response = await apiFetch(
        `/api/v1/buenas-practicas/${buenaPracticaId}/autoevaluacion`,
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        }
      );

      setAutoevaluacion(response.data?.autoevaluacion || null);

      toast.success(
        "La autoevaluación se guardó correctamente.",
        "Guardado exitoso"
      );
    } catch (err) {
      toast.error(
        err.message || "No fue posible guardar la autoevaluación.",
        "Error al guardar"
      );
    } finally {
      setSaving(false);
    }
  }

async function handleEnviar() {
  if (!canEdit) return;

  if (criteriosCompletos !== criterios.length) {
    toast.warning(
      "Completa todos los criterios con nivel y justificación antes de enviar.",
      "Autoevaluación incompleta"
    );
    return;
  }

  if (puntajeTotal < 16) {
    toast.warning(
      "La autoevaluación aún no alcanza el puntaje mínimo para enviarse a evaluación de pares.",
      "Puntaje insuficiente"
    );
    return;
  }

  try {
    setSending(true);

    await apiFetch(
      `/api/v1/buenas-practicas/${buenaPracticaId}/autoevaluacion/enviar`,
      {
        method: "POST",
        body: JSON.stringify({
          cambiado_por_id: user?.id,
        }),
      }
    );

    toast.success(
      "La autoevaluación fue enviada correctamente a evaluación de pares.",
      "Envío exitoso"
    );

    await loadAutoevaluacion();
  } catch (err) {
    if (err?.details?.pendientes?.length) {
      toast.warning(
        "La autoevaluación tiene pendientes por completar antes del envío.",
        "Pendientes detectados"
      );
      return;
    }

    if (err?.details?.puntaje_total !== undefined) {
      toast.warning(
        `El puntaje actual es ${err.details.puntaje_total} y aún no alcanza el mínimo requerido.`,
        "Puntaje insuficiente"
      );
      return;
    }

    toast.error(
      err.message || "No fue posible enviar la autoevaluación.",
      "Error al enviar"
    );
  } finally {
    setSending(false);
  }
}

  if (loading) {
    return (
      <AppShell title="Autoevaluación">
        <div className="p-6 text-sm text-slate-600">
          Cargando autoevaluación...
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Autoevaluación">
        <div className="p-6">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Autoevaluación de la buena práctica">
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Autoevaluación de la buena práctica
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Gestión y seguimiento de buenas prácticas institucionales.
          </p>
        </div>

        {!canEdit ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            La autoevaluación se encuentra en una etapa de revisión y actualmente no permite edición.
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* Contenido principal */}
          <div className="space-y-6">
            <section className="space-y-4">
            {criterios.map((criterio, index) => {
                const criterioCompleto =
                criterio.nivel !== null &&
                criterio.nivel !== undefined &&
                criterio.justificacion.trim();

                return (
                <article
                    key={criterio.catalogo_autoevaluacion_criterio_id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                    <div className="space-y-5">

                    {/* HEADER */}
                    <div className="flex items-start justify-between gap-4">
                        <div>
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            Criterio {criterio.orden}
                        </span>

                        <p className="mt-2 font-semibold text-slate-900">
                            {criterio.nombre}
                        </p>

                        <p className="mt-1 text-sm text-slate-500">
                            {criterio.descripcion}
                        </p>
                        </div>

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

                    {/* NIVEL */}
                    <div>
                        <p className="mb-2 text-sm font-medium text-slate-700">
                        Nivel (0–2)
                        </p>

                        <div className="inline-flex rounded-xl border border-slate-300 bg-slate-50 p-1">
                        {[0, 1, 2].map((nivel) => {
                            const selected = criterio.nivel === nivel;

                            return (
                            <button
                                key={nivel}
                                type="button"
                                disabled={!canEdit}
                                onClick={() =>
                                handleNivelChange(
                                    criterio.catalogo_autoevaluacion_criterio_id,
                                    nivel
                                )
                                }
                                className={[
                                "min-w-10 rounded-lg px-4 py-2 text-sm font-medium transition",
                                selected
                                    ? "bg-slate-900 text-white"
                                    : "text-slate-700 hover:bg-white",
                                !canEdit ? "cursor-default opacity-80" : "",
                                ].join(" ")}
                            >
                                {nivel}
                            </button>
                            );
                        })}
                        </div>
                    </div>

                    {/* JUSTIFICACIÓN */}
                    <div>
                        <p className="mb-2 text-sm font-medium text-slate-700">
                        Justificación
                        </p>

                        <textarea
                        value={criterio.justificacion}
                        onChange={(e) =>
                            handleJustificacionChange(
                            criterio.catalogo_autoevaluacion_criterio_id,
                            e.target.value
                            )
                        }
                        readOnly={!canEdit}
                        rows={4}
                        placeholder="Describe las evidencias o razones que justifican el nivel seleccionado..."
                        onInput={(e) => {
                            e.target.style.height = "auto";
                            e.target.style.height = e.target.scrollHeight + "px";
                        }}
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
              <h3 className="text-xl font-semibold text-slate-900">
                Resultados de la Autoevaluación
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Revise su puntaje total antes de enviar a evaluación de pares.
              </p>

              <div className="mt-5 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Puntaje total</p>
                  <p className="mt-2 text-3xl font-semibold text-slate-900">
                    {puntajeTotal} / 18
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Interpretación</p>
                  <div className="mt-2">
                    <span
                      className={[
                        "inline-flex rounded-full border px-3 py-1 text-sm font-medium",
                        getInterpretacionTone(interpretacion.tone),
                      ].join(" ")}
                    >
                      {interpretacion.label}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-500">
                  {canEdit
                    ? "Puedes guardar la autoevaluación como borrador o enviarla cuando esté completa."
                    : "La autoevaluación está en revisión y no permite cambios."}
                </p>

                {canEdit ? (
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={handleGuardar}
                      disabled={saving}
                      className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {saving ? "Guardando..." : "Guardar autoevaluación"}
                    </button>

                    <button
                      type="button"
                      onClick={handleEnviar}
                      disabled={sending}
                      className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {sending ? "Enviando..." : "Enviar a evaluación de pares"}
                    </button>
                  </div>
                ) : null}
              </div>
            </section>
          </div>

          {/* Panel lateral */}
          <div className="space-y-6 xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">
                Escala de niveles (0–2)
              </h3>

              <div className="mt-5 space-y-4">
                <ScaleItem
                  value={2}
                  title="Alto"
                  description="Se cumple plenamente el criterio, con evidencias sólidas y bien documentadas."
                  tone="emerald"
                />

                <ScaleItem
                  value={1}
                  title="Medio"
                  description="El criterio se cumple de manera parcial; existen evidencias, pero requieren mayor claridad o desarrollo."
                  tone="blue"
                />

                <ScaleItem
                  value={0}
                  title="Insuficiente"
                  description="El criterio no está cubierto o no hay evidencias que lo respalden."
                  tone="red"
                />
              </div>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <h4 className="text-lg font-semibold text-slate-900">
                  Interpretación del puntaje
                </h4>

                <div className="mt-4 space-y-3">
                  <ScoreInterpretation
                    label="16–18"
                    description="Práctica lista para enviar."
                    tone="emerald"
                  />
                  <ScoreInterpretation
                    label="12–15"
                    description="Requiere ajustes menores."
                    tone="blue"
                  />
                  <ScoreInterpretation
                    label="0–11"
                    description="Revisión interna necesaria antes de someterla a evaluación."
                    tone="amber"
                  />
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                  <Info size={18} className="text-slate-700" />
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    Avance de captura
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {criteriosCompletos} de {criterios.length} criterios completos
                  </p>
                </div>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-900 transition-all"
                  style={{
                    width: `${
                      criterios.length > 0
                        ? (criteriosCompletos / criterios.length) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>

              {criteriosCompletos === criterios.length ? (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-800">
                  La autoevaluación está completa.
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                  Aún faltan criterios por completar con nivel y justificación.
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function ScaleItem({ value, title, description, tone }) {
  return (
    <div className="flex gap-3">
      <span
        className={[
          "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-semibold",
          getScaleTone(tone),
        ].join(" ")}
      >
        {value}
      </span>

      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
    </div>
  );
}

function ScoreInterpretation({ label, description, tone }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={[
          "inline-flex rounded-full border px-3 py-1 text-sm font-semibold",
          getInterpretacionTone(tone),
        ].join(" ")}
      >
        {label}
      </span>

      <p className="pt-1 text-sm text-slate-700">{description}</p>
    </div>
  );
}

function getScaleTone(tone) {
  switch (tone) {
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "blue":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "red":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function getInterpretacionTone(tone) {
  switch (tone) {
    case "emerald":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "blue":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "amber":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}