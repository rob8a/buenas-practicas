import { NavLink, Outlet, useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  Send,
  X,
} from "lucide-react";
import { useState } from "react";
import AppShell from "../../components/layout/AppShell";
import { useValidacionEnvio } from "../../hooks/useValidacionEnvio";
import { getUser } from "../../lib/auth";
import { apiFetch } from "../../lib/api";
import { useBuenaPractica } from "../../hooks/useBuenaPractica";
import { useToast } from "../../components/feedback/ToastProvider";

const steps = [
  { key: "datos-generales", label: "Datos generales" },
  { key: "contexto", label: "Contexto y propósito" },
  { key: "fundamentacion", label: "Fundamentación" },
  { key: "metodologia", label: "Metodología y desarrollo" },
  { key: "foda", label: "FODA" },
  { key: "participacion", label: "Participación y colaboración" },
  { key: "evaluacion", label: "Evaluación e indicadores" },
  { key: "impacto", label: "Impacto y sostenibilidad" },
  { key: "conclusiones", label: "Conclusiones" },
];

export default function FichaLayout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const {
    validacion,
    loadingValidacion,
    errorValidacion,
    reloadValidacion,
  } = useValidacionEnvio(id);

  const [showPendientesModal, setShowPendientesModal] = useState(false);

  const validacionMap = new Map(
    (validacion?.secciones || []).map((item) => [item.clave, item])
  );

  const { buenaPractica } = useBuenaPractica(id);
  const canEdit = Boolean(buenaPractica?.buena_practica_estatus?.permite_edicion);

  const toast = useToast();

  async function handleEnviarAutoevaluacion() {
    const updated = await reloadValidacion();
    const data = updated || validacion;

    if (!data?.puede_enviar) {
      setShowPendientesModal(true);
      return;
    }

    try {
      await apiFetch(`/api/v1/buenas-practicas/${id}/enviar-autoevaluacion`, {
        method: "POST",
        body: JSON.stringify({
          cambiado_por_id: user?.id,
        }),
      });

      await reloadValidacion();
      //alert("La ficha fue enviada correctamente a autoevaluación.");
      toast.success(
        "La ficha fue enviada correctamente a autoevaluación.",
        "Envío exitoso"
      );
      navigate("/app/autoevaluacion");
    } catch (err) {
      if (err?.details?.secciones) {
        setShowPendientesModal(true);
        return;
      }

      toast.error(
        err.message || "No fue posible enviar la ficha a autoevaluación.",
        "Error al enviar"
      );
    }
  }

  function goToFirstPending() {
    const firstPending = validacion?.secciones?.find((item) => !item.completa);
    if (!firstPending) return;

    navigate(`/app/ficha/${id}/${firstPending.clave}`);
    setShowPendientesModal(false);
  }

  return (
    <AppShell title="Ficha de la buena práctica">
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* SIDEBAR */}
        <aside className="shrink-0 lg:w-72">
          <div className="space-y-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-4">
                <p className="text-xs text-slate-500">Buena práctica</p>
                <p className="font-semibold text-slate-800">ID #{id}</p>
              </div>

              <nav className="space-y-1">
                {steps.map((step, index) => {
                  const status = validacionMap.get(step.key);
                  const completa = status?.completa ?? false;

                  return (
                    <NavLink
                      key={step.key}
                      to={`/app/ficha/${id}/${step.key}`}
                      className={({ isActive }) =>
                        [
                          "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition",
                          isActive
                            ? "bg-slate-900 text-white"
                            : "text-slate-700 hover:bg-slate-100",
                        ].join(" ")
                      }
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="w-6 text-center text-xs font-semibold">
                          {index + 1}
                        </span>

                        <span className="truncate">{step.label}</span>
                      </div>

                      <span className="shrink-0">
                        {loadingValidacion ? (
                          <span className="inline-block h-2.5 w-2.5 rounded-full bg-slate-300" />
                        ) : completa ? (
                          <CheckCircle2 size={16} className="text-emerald-500" />
                        ) : (
                          <AlertCircle size={16} className="text-amber-500" />
                        )}
                      </span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">
                Validación de ficha
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {loadingValidacion
                  ? "Revisando completitud..."
                  : validacion
                  ? `${validacion.resumen.completadas} de ${validacion.resumen.total} secciones completas`
                  : "Sin información de validación"}
              </p>

              {errorValidacion ? (
                <p className="mt-2 text-xs text-red-600">{errorValidacion}</p>
              ) : null}

              <button
                type="button"
                onClick={handleEnviarAutoevaluacion}
                disabled={loadingValidacion}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send size={16} />
                Enviar a autoevaluación
              </button>
            </div>
          </div>
        </aside>

        {/* CONTENIDO */}
        <main className="flex-1">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <Outlet context={{ reloadValidacion, canEdit, buenaPractica }} />
          </div>
        </main>
      </div>

      {showPendientesModal ? (
        <PendientesModal
          validacion={validacion}
          onClose={() => setShowPendientesModal(false)}
          onGoToFirstPending={goToFirstPending}
        />
      ) : null}
    </AppShell>
  );
}

function PendientesModal({ validacion, onClose, onGoToFirstPending }) {
  const seccionesPendientes =
    validacion?.secciones?.filter((item) => !item.completa) || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/35"
        onClick={onClose}
        aria-label="Cerrar"
      />

      <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              No es posible enviar la ficha a autoevaluación
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Se detectaron pendientes en una o más secciones.
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

        <div className="max-h-[70vh] overflow-y-auto px-6 py-6">
          <div className="space-y-5">
            {seccionesPendientes.map((section) => (
              <div
                key={section.clave}
                className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4"
              >
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-amber-600" />
                  <h4 className="text-sm font-semibold text-slate-900">
                    {section.nombre}
                  </h4>
                </div>

                <ul className="mt-3 space-y-2 text-sm text-slate-700">
                  {section.pendientes.map((pendiente, index) => (
                    <li key={index} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current" />
                      <span>{pendiente}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Cerrar
          </button>

          <button
            type="button"
            onClick={onGoToFirstPending}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Ir a la primera sección pendiente
          </button>
        </div>
      </div>
    </div>
  );
}