import { useState } from "react";
import AppShell from "../components/layout/AppShell";
import { getUser } from "../lib/auth";
import {
  ClipboardPlus,
  FileText,
  CheckSquare,
  Users,
  ClipboardList,
} from "lucide-react";

const guideItems = [
  {
    title: "Crear buena práctica",
    icon: ClipboardPlus,
    text:
      "Permite registrar una nueva buena práctica, proporcionando información general para iniciar su registro dentro del sistema. Ahí se tendrá la opción de elegir si la buena práctica se crea desde cero o si se adopta o adapta.",
  },
  {
    title: "Ficha de la buena práctica",
    icon: FileText,
    text:
      "En esta sección se documenta la práctica con mayor detalle, incluyendo aspectos como antecedentes, contexto, propósito, metodología, resultados, hallazgos y evidencias. A esta opción se llega creando una buena práctica o editandola",
  },
  {
    title: "Autoevaluación",
    icon: CheckSquare,
    text:
      "Dirigido al equipo responsable que describe la práctica. El objetivo es validar que la información esté completa, coherente y cumpla con criterios establecidos antes de enviarla a la siguiente fase.",
  },
  {
    title: "Evaluación de pares",
    icon: Users,
    text:
      "Instrumento destinado para que los evaluadores externos revisen la práctica registrada y emitan una recomendación para el dictamen institucional. La evaluación se centra en el nivel alcanzado en cada criterio con base en evidencias verificables. Los criterios considerados son los 7 criterios del SEAES y los ejes transversales de Cultura de paz, Medio ambiente y sustentabilidad e Internacionalización solidaria.",
  },
  {
    title: "Listado de buenas prácticas",
    icon: ClipboardList,
    text:
      "Sección donde se pueden consultar todas las buenas prácticas registradas en el sistema, facilitando el intercambio de experiencias y el aprendizaje institucional.",
  },
];

const processSteps = [
  "Creación de una buena práctica",
  "Llenado de ficha",
  "Autoevaluación",
  "Evaluación de pares",
];

export default function Dashboard() {
  const user = getUser();
  const [activeTab, setActiveTab] = useState("guia");

  const nombre =
    user?.nombre ||
    user?.usuario ||
    "Usuario";

  return (
    <AppShell title="Inicio">
      <div className="space-y-6">
        {/* Bienvenida */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            Bienvenido(a), {nombre}
          </h2>

          <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
            <p>
              Bienvenido(a) al{" "}
              <strong>Sistema de Registro de Buenas Prácticas Institucionales</strong>,
              un espacio destinado a identificar, documentar, evaluar, validar y
              difundir experiencias exitosas desarrolladas en las distintas áreas
              académicas, administrativas y de gestión de la universidad.
            </p>

            <p>
              Las <strong>buenas prácticas</strong> son acciones, estrategias o
              iniciativas que han demostrado resultados positivos, generan
              aprendizaje institucional y pueden replicarse o adaptarse en otros
              contextos para contribuir a la mejora continua.
            </p>

            <p>
              La participación de la comunidad universitaria es fundamental para
              fortalecer la innovación, compartir conocimientos y promover la
              mejora continua en los procesos institucionales.
            </p>
          </div>
        </section>

        {/* Tabs */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-4">
            <button
              type="button"
              onClick={() => setActiveTab("guia")}
              className={[
                "rounded-xl px-4 py-2 text-sm font-semibold transition",
                activeTab === "guia"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              Guía del sistema
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("criterios")}
              className={[
                "rounded-xl px-4 py-2 text-sm font-semibold transition",
                activeTab === "criterios"
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
              ].join(" ")}
            >
              Criterios de evaluación
            </button>
          </div>

          {/* TAB: GUÍA */}
          {activeTab === "guia" && (
            <div className="mt-6">
              <h3 className="text-lg font-bold text-slate-900">
                Opciones del sistema de buenas prácticas
              </h3>

              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {guideItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article
                      key={item.title}
                      className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-white p-2 text-slate-700 shadow-sm ring-1 ring-slate-200">
                          <Icon size={20} />
                        </div>
                        <h4 className="text-base font-semibold text-slate-900">
                          {item.title}
                        </h4>
                      </div>

                      <p className="mt-4 text-sm leading-6 text-slate-600">
                        {item.text}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: CRITERIOS */}
          {activeTab === "criterios" && (
            <div className="mt-6 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Proceso de evaluación de una buena práctica
                </h3>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {processSteps.map((step, index) => (
                    <div key={step} className="flex items-center gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 shadow-sm">
                        <span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                          {index + 1}
                        </span>
                        {step}
                      </div>

                      {index < processSteps.length - 1 && (
                        <div className="hidden text-slate-400 md:block">→</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 text-sm leading-7 text-slate-600">
                <h3 className="text-lg font-bold text-slate-900">
                  Criterios para identificar y evaluar una buena práctica
                </h3>

                <p>
                  Para el registro y evaluación de una buena práctica se
                  consideran distintos criterios a lo largo del proceso. Por
                  ello, es importante que desde el momento del registro se tomen
                  en cuenta los criterios que serán revisados en las diferentes
                  etapas de evaluación.
                </p>
              </div>

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h4 className="text-base font-bold text-slate-900">
                  Etapa 1: Registro de una buena práctica
                </h4>

                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  <li>
                    <strong>Estabilidad:</strong> La práctica corresponde a una
                    iniciativa, mecanismo o proceso que se ha mantenido en el
                    tiempo, y no a una acción aislada.
                  </li>
                  <li>
                    <strong>Replicabilidad:</strong> La práctica puede ser
                    adoptada o adaptada por otras entidades federativas o
                    instituciones, o bien servir como referencia para el
                    desarrollo de iniciativas similares.
                  </li>
                  <li>
                    <strong>Autoevaluación o evidencia de funcionamiento:</strong>{" "}
                    La práctica cuenta con mecanismos de seguimiento, análisis o
                    documentación, o bien con evidencias verificables de su
                    implementación y resultados.
                  </li>
                  <li>
                    <strong>Aportación:</strong> La práctica contribuye a la
                    evaluación y mejora continua del Sistema Estatal de Educación
                    Superior, ya sea de manera directa o indirecta, y genera
                    aprendizajes.
                  </li>
                </ul>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h4 className="text-base font-bold text-slate-900">
                  Etapa 2: Autoevaluación
                </h4>

                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                  <li>
                    <strong>Pertinencia y relevancia:</strong> Responde a
                    necesidades reales y está alineada a la planeación
                    institucional.
                  </li>
                  <li>
                    <strong>Resultados verificables:</strong> Incluye
                    indicadores claros y evidencias de logro.
                  </li>
                  <li>
                    <strong>Innovación y mejora:</strong> Integra elementos
                    novedosos o mejoras sustantivas a procesos existentes.
                  </li>
                  <li>
                    <strong>Sistematización:</strong> Está documentada y
                    organizada de manera estructurada.
                  </li>
                  <li>
                    <strong>Eficiencia y economía:</strong> Hace un uso óptimo
                    de recursos humanos, materiales y financieros.
                  </li>
                  <li>
                    <strong>Replicabilidad:</strong> Puede adoptarse o adaptarse
                    en otros contextos de la institución.
                  </li>
                  <li>
                    <strong>Participación y colaboración:</strong> Involucra
                    actores clave internos y/o externos en su implementación.
                  </li>
                  <li>
                    <strong>Evaluación y mejora continua:</strong> Incluye
                    mecanismos de seguimiento, evaluación y retroalimentación.
                  </li>
                  <li>
                    <strong>Contribución al aprendizaje institucional:</strong>{" "}
                    Aporta experiencias y aprendizajes transferibles a otras
                    áreas.
                  </li>
                </ul>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <h4 className="text-base font-bold text-slate-900">
                  Etapa 3: Evaluación de pares
                </h4>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Durante la evaluación externa, las buenas prácticas serán
                  valoradas con base en los siguientes criterios:
                </p>

                <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-600">
                  <li>Responsabilidad social</li>
                  <li>Equidad social y de género *</li>
                  <li>Inclusión *</li>
                  <li>Excelencia</li>
                  <li>Vanguardia</li>
                  <li>Innovación social</li>
                  <li>Interculturalidad</li>
                  <li>Cultura de paz *</li>
                  <li>Medio ambiente y sustentabilidad *</li>
                  <li>Internacionalización solidaria</li>
                </ul>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  * En estos 4 criterios se recomienda respaldarlos correctamente,
                  ya que son un punto de atención para esta etapa de evaluación.
                </p>

                <p className="mt-4 text-sm leading-6 text-slate-600">
                  Para conocer el detalle de estos criterios consulte el
                  siguiente documento:{" "}
                  <a
                    href="#"
                    className="font-medium text-slate-900 underline underline-offset-4"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver documento de criterios
                  </a>
                </p>
              </section>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}