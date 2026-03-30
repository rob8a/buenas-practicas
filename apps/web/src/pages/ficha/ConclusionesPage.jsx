import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { useBuenaPractica } from "../../hooks/useBuenaPractica";
import { useOutletContext } from "react-router-dom";

const initialForm = {
  principales_aprendizajes: "",
  recomendaciones_propuestas: "",
};

export default function ConclusionesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buenaPractica, loading, error } = useBuenaPractica(id);

  const [form, setForm] = useState(initialForm);
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const { reloadValidacion, canEdit } = useOutletContext();

  useEffect(() => {
    if (!buenaPractica) return;

    const conclusiones = buenaPractica.buena_practica_conclusion;

    setForm({
      principales_aprendizajes:
        conclusiones?.principales_aprendizajes || "",
      recomendaciones_propuestas:
        conclusiones?.recomendaciones_propuestas || "",
    });
  }, [buenaPractica]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function saveForm() {
    if (!canEdit) return;

    setSaveError("");
    setSuccess("");

    try {
      setSaving(true);

      await apiFetch(`/api/v1/buenas-practicas/${id}/conclusiones`, {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      await reloadValidacion();
      setSuccess(
        "Conclusiones guardadas correctamente."
      );
    } catch (err) {
      setSaveError(
        err.message ||
          "No fue posible guardar la información de conclusiones."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await saveForm();
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

  const impacto =
    buenaPractica.buena_practica_impacto_sostenibilidad || {};

  return (
    <div className="space-y-8">
      {/* encabezado */}
      {!canEdit ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          La ficha se encuentra en <strong>{buenaPractica?.buena_practica_estatus?.nombre}</strong> y actualmente no permite edición.
        </div>
      ) : null}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">
          2.9 Conclusiones
        </h2>

        <p className="text-sm text-slate-600">
          Síntesis final y recomendaciones derivadas de la buena práctica.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* conclusiones */}
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <h3 className="text-lg font-semibold text-slate-900">
            Conclusiones
          </h3>

          <TextareaField
            label="Principales aprendizajes"
            required
            hint="¿Qué aprendizajes dejó esta práctica?"
            name="principales_aprendizajes"
            value={form.principales_aprendizajes}
            onChange={handleChange}
            disabled={!canEdit}
          />

          <TextareaField
            label="Recomendaciones y propuestas"
            required
            hint="¿Qué recomendaciones o propuestas pueden derivarse?"
            name="recomendaciones_propuestas"
            value={form.recomendaciones_propuestas}
            onChange={handleChange}
            disabled={!canEdit}
          />
        </section>

        {/* resumen */}
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-slate-900">
            Resumen final
          </h3>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm space-y-2">
            <p>
              <strong>Título:</strong>{" "}
              {buenaPractica.titulo || "Sin especificar"}
            </p>

            <p>
              <strong>Estado:</strong>{" "}
              {buenaPractica.buena_practica_estatus?.nombre ||
                "Sin especificar"}
            </p>

            <p>
              <strong>Periodo:</strong>{" "}
              {buenaPractica.buena_practica_datos_generales?.periodo_implementacion || "Sin especificar"}
            </p>

            <p>
              <strong>Objetivo:</strong>{" "}
                {buenaPractica.buena_practica_contexto_proposito?.objetivo_central || "Sin especificar"}
            </p>

            <p>
              <strong>
                ¿De qué manera esta buena práctica ha servido como motor
                de cambio?
              </strong>
            </p>

            <p>
              {impacto.motor_cambio_mejora_continua || "Sin especificar"}
            </p>

            <p className="text-xs text-slate-500 pt-2">
              Este resumen se genera automáticamente a partir de la
              información ingresada en los pasos anteriores.
            </p>
          </div>
        </section>

        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
          <strong>Revisión final:</strong> Antes de enviar, revise que toda
          la información esté completa y correcta. Puede guardar el
          borrador y regresar más tarde para completar campos pendientes.
        </div>

        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        ) : null}

        <div className="flex justify-end">
          <p className="text-sm text-slate-500">
            {canEdit
              ? ""
              : "La ficha está en una etapa de revisión y actualmente no permite edición."}
          </p>
          {canEdit ? (
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {saving ? "Guardando..." : "Guardar conclusiones"}
          </button>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function TextareaField({
  label,
  hint,
  required,
  name,
  value,
  onChange,
  disabled = false,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {hint && (
        <p className="mb-2 text-xs text-slate-500">{hint}</p>
      )}

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={6}
        disabled={disabled}
        className={[
          "w-full rounded-xl px-4 py-3 outline-none",
          disabled
            ? "bg-slate-50 text-slate-700 border border-slate-200 cursor-default"
            : "border border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        ].join(" ")}
      />
    </div>
  );
}