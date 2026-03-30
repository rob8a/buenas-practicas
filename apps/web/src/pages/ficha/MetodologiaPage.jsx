import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Info, X } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { useBuenaPractica } from "../../hooks/useBuenaPractica";
import { useOutletContext } from "react-router-dom";

const PHASES = [
  {
    numero: 1,
    nombre: "Identificación y encuadre",
    resumen:
      "Detectar el problema o necesidad y delimitar el alcance del proyecto",
    tone: "blue",
    guide: [
      "Problema detectado",
      "Contexto",
      "Objetivos",
      "Justificación",
      "Recursos",
      "Alcance",
    ],
  },
  {
    numero: 2,
    nombre: "Recopilación y organización",
    resumen:
      "Reunir datos relevantes que permitan comprender mejor la situación",
    tone: "cyan",
    guide: [
      "Técnicas aplicadas",
      "Instrumentos usados",
      "Población o muestra",
      "Tipo de datos",
      "Forma de organización",
    ],
  },
  {
    numero: 3,
    nombre: "Análisis de resultados",
    resumen:
      "Interpretar la información recopilada para tomar decisiones fundamentadas",
    tone: "amber",
    guide: [
      "Interpretación",
      "Comparación con objetivos",
      "Hallazgos",
      "Logros",
      "Conclusiones",
    ],
  },
  {
    numero: 4,
    nombre: "Documentación",
    resumen:
      "Sistematizar el proceso y dejar evidencia de la experiencia",
    tone: "violet",
    guide: [
      "Descripción del proceso",
      "Evidencias",
      "Resultados finales",
      "Aprendizajes",
      "Recomendaciones",
    ],
  },
  {
    numero: 5,
    nombre: "Difusión y replicabilidad",
    resumen:
      "Compartir la experiencia y facilitar que pueda implementarse en otros contextos",
    tone: "emerald",
    guide: [
      "Medios de difusión",
      "Impacto",
      "Adaptación",
      "Condiciones para replicar",
    ],
  },
];

const toneClasses = {
  blue: {
    tab: "border-blue-200 bg-blue-50 text-blue-900",
    card: "border-blue-200 bg-blue-50/50",
    badge: "bg-blue-100 text-blue-700",
    modal: "border-blue-300 bg-blue-50/50",
  },
  cyan: {
    tab: "border-cyan-200 bg-cyan-50 text-cyan-900",
    card: "border-cyan-200 bg-cyan-50/50",
    badge: "bg-cyan-100 text-cyan-700",
    modal: "border-cyan-300 bg-cyan-50/50",
  },
  amber: {
    tab: "border-amber-200 bg-amber-50 text-amber-900",
    card: "border-amber-200 bg-amber-50/50",
    badge: "bg-amber-100 text-amber-700",
    modal: "border-amber-300 bg-amber-50/50",
  },
  violet: {
    tab: "border-violet-200 bg-violet-50 text-violet-900",
    card: "border-violet-200 bg-violet-50/50",
    badge: "bg-violet-100 text-violet-700",
    modal: "border-violet-300 bg-violet-50/50",
  },
  emerald: {
    tab: "border-emerald-200 bg-emerald-50 text-emerald-900",
    card: "border-emerald-200 bg-emerald-50/50",
    badge: "bg-emerald-100 text-emerald-700",
    modal: "border-emerald-300 bg-emerald-50/50",
  },
};

const initialMetodologia = {
  descripcion_general: "",
};

function buildInitialPhases() {
  return PHASES.map((phase) => ({
    numero_fase: phase.numero,
    nombre_fase: phase.nombre,
    descripcion: "",
    duracion: "",
    sin_informacion: false,
    archivo_evidencia: null,
    archivo_evidencia_nombre: "",
  }));
}

export default function MetodologiaPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buenaPractica, loading, error } = useBuenaPractica(id);

  const [form, setForm] = useState(initialMetodologia);
  const [phases, setPhases] = useState(buildInitialPhases());
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  const { reloadValidacion, canEdit } = useOutletContext();

  useEffect(() => {
    if (!buenaPractica) return;

    setForm({
      descripcion_general:
        buenaPractica.buena_practica_metodologia?.descripcion_general || "",
    });

    if (
      Array.isArray(buenaPractica.buena_practica_fase) &&
      buenaPractica.buena_practica_fase.length > 0
    ) {
      const loaded = buildInitialPhases().map((base) => {
        const found = buenaPractica.buena_practica_fase.find(
          (item) => Number(item.numero_fase) === base.numero_fase
        );

        return found
          ? {
              ...base,
              descripcion: found.descripcion || "",
              duracion: found.duracion || "",
              sin_informacion: Boolean(found.sin_informacion),
                archivo_evidencia: null,
                archivo_evidencia_nombre:
                Array.isArray(found.buena_practica_fase_evidencia) &&
                found.buena_practica_fase_evidencia.length > 0
                    ? found.buena_practica_fase_evidencia[0].nombre_original || ""
                    : "",
            }
          : base;
      });

      setPhases(loaded);
    } else {
      setPhases(buildInitialPhases());
    }
  }, [buenaPractica]);

  const tabs = useMemo(() => PHASES, []);

  function handleMetodologiaChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handlePhaseChange(numero, field, value) {
    setPhases((prev) =>
      prev.map((phase) =>
        phase.numero_fase === numero ? { ...phase, [field]: value } : phase
      )
    );
  }

    function handlePhaseCheckbox(numero, checked) {
        setPhases((prev) =>
            prev.map((phase) => {
            if (phase.numero_fase !== numero) return phase;

            if (checked) {
                return {
                ...phase,
                sin_informacion: true,
                descripcion: "Aún no se cuenta con información para esta fase.",
                duracion: "Por definir",
                };
            }

            return {
                ...phase,
                sin_informacion: false,
                descripcion:
                phase.descripcion === "Aún no se cuenta con información para esta fase."
                    ? ""
                    : phase.descripcion,
                duracion: phase.duracion === "Por definir" ? "" : phase.duracion,
            };
            })
        );
    }

    function handlePhaseFileChange(numero, file) {
        setPhases((prev) =>
            prev.map((phase) =>
            phase.numero_fase === numero
                ? {
                    ...phase,
                    archivo_evidencia: file || null,
                    archivo_evidencia_nombre: file ? file.name : "",
                }
                : phase
            )
        );
    }

  async function saveForm(goNext = false) {
    setSaveError("");
    setSuccess("");

    try {
      setSaving(true);

        await apiFetch(`/api/v1/buenas-practicas/${id}/metodologia`, {
        method: "PATCH",
        body: JSON.stringify({
            descripcion_general: form.descripcion_general,
            fases: phases.map((phase) => ({
            numero_fase: phase.numero_fase,
            nombre_fase: phase.nombre_fase,
            descripcion: phase.descripcion,
            duracion: phase.duracion,
            sin_informacion: phase.sin_informacion,
            })),
        }),
        });

        await reloadValidacion();
      if (goNext) {
        navigate(`/app/ficha/${id}/foda`);
        return;
      }

      setSuccess(
        "Metodología y desarrollo guardados correctamente."
      );
    } catch (err) {
      setSaveError(
        err.message ||
          "No fue posible guardar la información de metodología y desarrollo."
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
    <>
      <div className="space-y-8">
        {!canEdit ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          La ficha se encuentra en <strong>{buenaPractica?.buena_practica_estatus?.nombre}</strong> y actualmente no permite edición.
        </div>
      ) : null}
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900">
            2.4 Metodología y desarrollo
          </h2>

          <div className="space-y-1 text-sm leading-6 text-slate-600">
            <p>Descripción del proceso metodológico y fases de implementación.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Descripción metodológica */}
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Descripción metodológica
              </h3>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Descripción general de la metodología{" "}
                <span className="text-red-500">*</span>
              </label>
              <p className="mb-2 text-xs text-slate-500">
                Explique enfoque, métodos, técnicas y herramientas utilizadas.
              </p>

              <textarea
                name="descripcion_general"
                value={form.descripcion_general}
                onChange={handleMetodologiaChange}
                rows={4}
                placeholder="Describa el enfoque, métodos, técnicas y herramientas..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </section>

          {/* Fases del proceso */}
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Fases del proceso
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Complete la información para cada una de las 5 fases. Si aún no
                  cuenta con datos, marque la casilla correspondiente.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowGuide(true)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50"
                title="Ver guía de fases"
                aria-label="Ver guía de fases"
              >
                <Info size={16} />
              </button>
            </div>

            <div>
              <p className="text-sm font-medium text-slate-700">
                Guía rápida de fases
              </p>
              <p className="mt-1 text-xs text-slate-500">
                Consulta qué se espera documentar en cada fase.
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-5">
              {tabs.map((phase) => {
                const styles = toneClasses[phase.tone];

                return (
                  <div
                    key={phase.numero}
                    className={`rounded-xl border px-3 py-3 text-sm font-medium ${styles.tab}`}
                  >
                    <div className="mb-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white/80 px-2 text-xs font-semibold">
                      {phase.numero}
                    </div>
                    <div className="leading-5">{phase.nombre}</div>
                  </div>
                );
              })}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              {PHASES.map((phase) => {
                const styles = toneClasses[phase.tone];
                const phaseData =
                  phases.find((item) => item.numero_fase === phase.numero) ||
                  buildInitialPhases().find(
                    (item) => item.numero_fase === phase.numero
                  );

                return (
                  <div
                    key={phase.numero}
                    className={[
                        "rounded-2xl border p-4 transition",
                        styles.card,
                        phaseData?.sin_informacion ? "opacity-85 ring-1 ring-slate-300" : "",
                        ].join(" ")}
                  >
                    <div className="mb-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${styles.badge}`}>
                            Fase {phase.numero}
                            </div>

                            <label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">
                            <input
                                type="checkbox"
                                checked={Boolean(phaseData?.sin_informacion)}
                                onChange={(e) =>
                                handlePhaseCheckbox(phase.numero, e.target.checked)
                                }
                                className="h-4 w-4 rounded border-slate-300"
                            />
                            <span>Sin información aún</span>
                            </label>
                        </div>

                        <div>
                            <h4 className="text-base font-semibold text-slate-900">
                            {phase.nombre}
                            </h4>
                            <p className="mt-1 text-xs leading-5 text-slate-600">
                            {phase.resumen}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">
                          Descripción <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            rows={4}
                            value={phaseData?.descripcion || ""}
                            disabled={Boolean(phaseData?.sin_informacion)}
                            onChange={(e) =>
                                handlePhaseChange(
                                phase.numero,
                                "descripcion",
                                e.target.value
                                )
                            }
                            placeholder="Describe qué se hace en esta fase..."
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
                        />
                      </div>



                    <div className="space-y-4">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                            Duración <span className="text-red-500">*</span>
                            </label>
                            <input
                            type="text"
                            value={phaseData?.duracion || ""}
                            disabled={Boolean(phaseData?.sin_informacion)}
                            onChange={(e) =>
                                handlePhaseChange(
                                phase.numero,
                                "duracion",
                                e.target.value
                                )
                            }
                            placeholder="Ej. 2 semanas"
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-500"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-slate-700">
                            Anexar evidencia
                            </label>

                            <input
                            type="file"
                            onChange={(e) =>
                                handlePhaseFileChange(phase.numero, e.target.files?.[0] || null)
                            }
                            className="block w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
                            />

                            {phaseData?.archivo_evidencia_nombre ? (
                            <p className="mt-2 text-xs text-slate-500">
                                Archivo seleccionado:{" "}
                                <span className="font-medium">{phaseData.archivo_evidencia_nombre}</span>
                            </p>
                            ) : (
                            <p className="mt-2 text-xs text-slate-500">
                                Adjunta un archivo como evidencia de esta fase.
                            </p>
                            )}
                        </div>
                    </div>

                     
                    </div>
                  </div>
                );
              })}
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
              {canEdit
              ? "Puedes guardar el avance actual como borrador o guardar y continuar al siguiente apartado de la ficha."
              : "La ficha está en una etapa de revisión y actualmente no permite edición."}
            </p>
                {canEdit ? (
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
            ) : null}
          </div>
        </form>
      </div>

      {showGuide ? (
        <PhaseGuideModal phases={PHASES} onClose={() => setShowGuide(false)} />
      ) : null}
    </>
  );
}

function PhaseGuideModal({ phases, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/35"
        onClick={onClose}
        aria-label="Cerrar guía de fases"
      />

      <div className="relative z-10 w-full max-w-5xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Guía de fases del proceso
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Usa esta referencia para completar la descripción y evidencias de
              cada fase.
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

        <div className="grid gap-4 px-6 py-6 md:grid-cols-2 xl:grid-cols-3">
          {phases.map((phase) => {
            const styles = toneClasses[phase.tone];

            return (
              <section
                key={phase.numero}
                className={`rounded-2xl border p-4 ${styles.modal}`}
              >
                <h4 className="text-sm font-semibold text-slate-900">
                  {phase.numero}. {phase.nombre}
                </h4>

                <ul className="mt-3 space-y-1 text-sm text-slate-700">
                  {phase.guide.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <div className="flex justify-end border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}