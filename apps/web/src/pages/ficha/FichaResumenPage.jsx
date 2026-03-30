import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AppShell from "../../components/layout/AppShell";
import { useBuenaPractica } from "../../hooks/useBuenaPractica";

export default function FichaResumenPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buenaPractica, loading, error } = useBuenaPractica(id);

  const responsables = useMemo(
    () => buenaPractica?.buena_practica_responsable || [],
    [buenaPractica]
  );

  const alineaciones = useMemo(
    () => buenaPractica?.buena_practica_alineacion || [],
    [buenaPractica]
  );

  const unidadesParticipantes = useMemo(
    () => buenaPractica?.buena_practica_unidad_participante || [],
    [buenaPractica]
  );

  const lineaTiempo = useMemo(
    () => buenaPractica?.buena_practica_linea_tiempo || [],
    [buenaPractica]
  );

  const fases = useMemo(
    () => buenaPractica?.buena_practica_fase || [],
    [buenaPractica]
  );

  const actores = useMemo(
    () => buenaPractica?.buena_practica_actor_involucrado || [],
    [buenaPractica]
  );

  const indicadores = useMemo(
    () => buenaPractica?.buena_practica_indicador || [],
    [buenaPractica]
  );

  const testimonios = useMemo(
    () => buenaPractica?.buena_practica_testimonio || [],
    [buenaPractica]
  );

  if (loading) {
    return (
      <AppShell title="Resumen de la ficha">
        <div className="p-6 text-sm text-slate-600">Cargando ficha...</div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell title="Resumen de la ficha">
        <div className="p-6">
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        </div>
      </AppShell>
    );
  }

  if (!buenaPractica) {
    return (
      <AppShell title="Resumen de la ficha">
        <div className="p-6 text-sm text-slate-600">
          No se encontró la buena práctica.
        </div>
      </AppShell>
    );
  }

  const datosGenerales = buenaPractica.buena_practica_datos_generales;
  const contexto = buenaPractica.buena_practica_contexto_proposito;
  const fundamentacion = buenaPractica.buena_practica_fundamentacion;
  const metodologia = buenaPractica.buena_practica_metodologia;
  const foda = buenaPractica.buena_practica_foda;
  const participacion = buenaPractica.buena_practica_participacion_colaboracion;
  const evaluacion = buenaPractica.buena_practica_evaluacion_indicadores;
  const impacto = buenaPractica.buena_practica_impacto_sostenibilidad;
  const conclusion = buenaPractica.buena_practica_conclusion;

  return (
    <AppShell title="Resumen de la ficha">
      <div className="space-y-6 p-4 md:p-6">
        <div className="no-print flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Resumen de la buena práctica
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Vista de solo lectura para revisión y exportación.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Volver
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Imprimir / PDF
            </button>
          </div>
        </div>

        <article className="mx-auto max-w-5xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8 print:shadow-none print:border-none print:max-w-none">
          <header className="border-b border-slate-200 pb-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Buena práctica
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                  {buenaPractica.titulo}
                </h2>

                {datosGenerales?.subtitulo_lema ? (
                  <p className="mt-2 text-lg text-slate-600">
                    {datosGenerales.subtitulo_lema}
                  </p>
                ) : null}
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                <InfoRow
                  label="Estatus"
                  value={buenaPractica.buena_practica_estatus?.nombre}
                />
                <InfoRow
                  label="Unidad"
                  value={buenaPractica.unidad_organizacional?.nombre}
                />
                <InfoRow
                  label="Periodo"
                  value={datosGenerales?.periodo_implementacion}
                />
              </div>
            </div>
          </header>

          <div className="mt-8 space-y-8">
            <Section title="1. Datos generales">
              <FieldBlock
                label="Descripción breve"
                value={buenaPractica.descripcion_breve}
              />

              <ListBlock
                label="Personas responsables"
                items={responsables.map((item) => {
                  const nombre = [
                    item.nombre,
                    item.apellido_paterno,
                    item.apellido_materno,
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return nombre || item.cargo || "Sin especificar";
                })}
              />

              <ListBlock
                label="Alineaciones"
                items={alineaciones.map((item) => {
                  const grupo = item.catalogo_alineacion?.grupo || "Grupo";
                  const valor = item.catalogo_alineacion?.valor || "";
                  return `${grupo}: ${valor}`;
                })}
              />
            </Section>

            <Section title="2. Contexto y propósito">
              <FieldBlock label="Entorno" value={contexto?.entorno} />
              <FieldBlock
                label="Necesidad o problemática"
                value={contexto?.necesidad_problematica}
              />
              <ListBlock
                label="Unidades participantes"
                items={unidadesParticipantes.map(
                  (item) => item.unidad_organizacional?.nombre || "Sin especificar"
                )}
              />
              <FieldBlock
                label="Vinculación con metas"
                value={contexto?.vinculacion_metas}
              />
              <FieldBlock
                label="Estado actual de la práctica"
                value={contexto?.estado_practica}
              />
              <FieldBlock
                label="Propósito general"
                value={contexto?.proposito_general}
              />
              <FieldBlock
                label="Objetivo central"
                value={contexto?.objetivo_central}
              />
              <FieldBlock
                label="Población beneficiaria"
                value={contexto?.poblacion_beneficiaria}
              />
              <FieldBlock
                label="Condiciones que motivaron la acción"
                value={contexto?.condiciones_origen}
              />
              <ListBlock
                label="Línea del tiempo"
                items={lineaTiempo.map((item) => {
                  const fecha = item.fecha ? formatDate(item.fecha) : "Sin fecha";
                  return `${fecha} — ${item.titulo || "Evento"}${item.descripcion ? `: ${item.descripcion}` : ""}`;
                })}
              />
            </Section>

            <Section title="3. Fundamentación">
              <FieldBlock
                label="Vinculación con el modelo educativo"
                value={fundamentacion?.vinculacion_modelo_educativo}
              />
              <FieldBlock
                label="Fundamentación teórica"
                value={fundamentacion?.fundamentacion_teorica}
              />
              <FieldBlock
                label="Política institucional"
                value={fundamentacion?.politica_institucional}
              />
            </Section>

            <Section title="4. Metodología y desarrollo">
              <FieldBlock
                label="Descripción general de la metodología"
                value={metodologia?.descripcion_general}
              />

              <div>
                <h4 className="text-sm font-medium text-slate-700">
                  Fases del proceso
                </h4>

                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  {fases.map((fase) => (
                    <div
                      key={fase.id}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                    >
                      <p className="font-semibold text-slate-900">
                        Fase {fase.numero_fase}
                      </p>
                      <p className="mt-2 text-sm text-slate-600">
                        {fase.descripcion || "Sin descripción"}
                      </p>
                      <p className="mt-3 text-xs text-slate-500">
                        Duración: {fase.duracion || "Sin especificar"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            <Section title="5. Análisis FODA">
              <FieldBlock label="Fortalezas" value={foda?.fortalezas} />
              <FieldBlock label="Oportunidades" value={foda?.oportunidades} />
              <FieldBlock label="Debilidades" value={foda?.debilidades} />
              <FieldBlock label="Amenazas" value={foda?.amenazas} />
            </Section>

            <Section title="6. Participación y colaboración">
              <ListBlock
                label="Actores involucrados"
                items={actores.map((item) => {
                  const actor = [
                    item.nombre,
                    item.rol ? `(${item.rol})` : "",
                    item.unidad_organizacional?.nombre
                      ? `- ${item.unidad_organizacional.nombre}`
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ");
                  return actor || "Sin especificar";
                })}
              />
              <FieldBlock
                label="Coordinación del trabajo colaborativo"
                value={participacion?.descripcion_coordinacion}
              />
              <FieldBlock
                label="Aportes interdisciplinarios"
                value={participacion?.aportes_interdisciplinarios}
              />
            </Section>

            <Section title="7. Evaluación, indicadores y evidencias">
              <FieldBlock
                label="Instrumentos de evaluación"
                value={evaluacion?.instrumentos_evaluacion}
              />
              <FieldBlock label="Logros clave" value={evaluacion?.logros_clave} />
              <FieldBlock
                label="Hallazgos identificados"
                value={evaluacion?.hallazgos_identificados}
              />
              <ListBlock
                label="Indicadores"
                items={indicadores.map((item) => {
                  return `${item.nombre || "Indicador"}${
                    item.indicador ? ` — ${item.indicador}` : ""
                  }${item.meta_esperada ? ` | Meta: ${item.meta_esperada}` : ""}`;
                })}
              />
              <ListBlock
                label="Testimonios"
                items={testimonios.map((item) =>
                  item.cargo
                    ? `${item.cargo}: ${item.testimonio}`
                    : item.testimonio
                )}
              />
            </Section>

            <Section title="8. Impacto y sostenibilidad">
              <FieldBlock
                label="Sistematización de hallazgos"
                value={impacto?.sistematizacion_hallazgos}
              />
              <FieldBlock
                label="Instancias que reciben recomendaciones"
                value={impacto?.instancias_recomendaciones}
              />
              <FieldBlock
                label="Resultados inmediatos"
                value={impacto?.resultados_inmediatos}
              />
              <FieldBlock
                label="Efectos a mediano plazo"
                value={impacto?.efectos_mediano_plazo}
              />
              <FieldBlock
                label="Vinculación con PIDE, SEAES u ODS"
                value={impacto?.vinculacion_pide_seaes_ods}
              />
              <FieldBlock
                label="Condiciones de permanencia"
                value={impacto?.condiciones_permanencia}
              />
              <FieldBlock
                label="Aspectos para replicabilidad"
                value={impacto?.aspectos_replicabilidad}
              />
              <FieldBlock
                label="Motor de cambio"
                value={impacto?.motor_cambio_mejora_continua}
              />
              <FieldBlock
                label="Acciones o estrategias derivadas"
                value={impacto?.acciones_estrategias_derivadas}
              />
            </Section>

            <Section title="9. Conclusiones">
              <FieldBlock
                label="Principales aprendizajes"
                value={conclusion?.principales_aprendizajes}
              />
              <FieldBlock
                label="Recomendaciones y propuestas"
                value={conclusion?.recomendaciones_propuestas}
              />
            </Section>
          </div>
        </article>
      </div>
    </AppShell>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-4">
      <h3 className="border-b border-slate-200 pb-2 text-xl font-semibold text-slate-900">
        {title}
      </h3>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function FieldBlock({ label, value }) {
  return (
    <div>
      <h4 className="text-sm font-medium text-slate-700">{label}</h4>
      <div className="mt-2 whitespace-pre-line rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
        {value || "Sin información"}
      </div>
    </div>
  );
}

function ListBlock({ label, items = [] }) {
  return (
    <div>
      <h4 className="text-sm font-medium text-slate-700">{label}</h4>
      <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        {items.length > 0 ? (
          <ul className="space-y-2 text-sm text-slate-800">
            {items.map((item, index) => (
              <li key={index} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Sin información</p>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="mb-2">
      <span className="block text-xs text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-800">
        {value || "Sin especificar"}
      </span>
    </div>
  );
}

function formatDate(value) {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}