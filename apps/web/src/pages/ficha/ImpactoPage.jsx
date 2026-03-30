import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { useBuenaPractica } from "../../hooks/useBuenaPractica";
import { useOutletContext } from "react-router-dom";

const initialForm = {
  sistematizacion_hallazgos: "",
  instancias_recomendaciones: "",
  resultados_inmediatos: "",
  efectos_mediano_plazo: "",
  vinculacion_pide_seaes_ods: "",
  condiciones_permanencia: "",
  aspectos_replicabilidad: "",
  motor_cambio_mejora_continua: "",
  acciones_estrategias_derivadas: "",
};

export default function ImpactoPage() {
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

    const impacto = buenaPractica.buena_practica_impacto_sostenibilidad;

    setForm({
      sistematizacion_hallazgos: impacto?.sistematizacion_hallazgos || "",
      instancias_recomendaciones: impacto?.instancias_recomendaciones || "",
      resultados_inmediatos: impacto?.resultados_inmediatos || "",
      efectos_mediano_plazo: impacto?.efectos_mediano_plazo || "",
      vinculacion_pide_seaes_ods: impacto?.vinculacion_pide_seaes_ods || "",
      condiciones_permanencia: impacto?.condiciones_permanencia || "",
      aspectos_replicabilidad: impacto?.aspectos_replicabilidad || "",
      motor_cambio_mejora_continua:
        impacto?.motor_cambio_mejora_continua || "",
      acciones_estrategias_derivadas:
        impacto?.acciones_estrategias_derivadas || "",
    });
  }, [buenaPractica]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function saveForm(goNext = false) {
    setSaveError("");
    setSuccess("");

    try {
      setSaving(true);

        await apiFetch(`/api/v1/buenas-practicas/${id}/impacto`, {
        method: "PATCH",
        body: JSON.stringify(form),
        });

        await reloadValidacion();
      if (goNext) {
        navigate(`/app/ficha/${id}/conclusiones`);
        return;
      }

      setSuccess(
        "Impacto y sostenibilidad guardados correctamente."
      );
    } catch (err) {
      setSaveError(
        err.message ||
          "No fue posible guardar la información de impacto y sostenibilidad."
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
      {!canEdit ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          La ficha se encuentra en <strong>{buenaPractica?.buena_practica_estatus?.nombre}</strong> y actualmente no permite edición.
        </div>
      ) : null}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">
          2.8 Impacto y sostenibilidad
        </h2>

        <div className="space-y-1 text-sm leading-6 text-slate-600">
          <p>
            Evaluación del impacto, mejora continua y condiciones de sostenibilidad.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Evaluación y mejora continua
            </h3>
          </div>

          <TextareaField
            label="¿Cómo sistematizar los hallazgos de las evaluaciones?"
            required
            hint="Explica el proceso para organizar los hallazgos de las evaluaciones y cómo se transforman en mejoras reales."
            placeholder="Ejemplo: Ingresamos los resultados en un tablero de control mensual; los hallazgos críticos generan de inmediato un plan de mejora con responsables y fechas, cuyo avance revisamos en el comité técnico para asegurar que el cambio sea permanente."
            name="sistematizacion_hallazgos"
            value={form.sistematizacion_hallazgos}
            onChange={handleChange}
          />

          <TextareaField
            label="¿Qué instancias reciben las recomendaciones?"
            required
            hint="Cuerpos colegiados o áreas responsables que reciben y revisan las recomendaciones."
            name="instancias_recomendaciones"
            value={form.instancias_recomendaciones}
            onChange={handleChange}
          />
        </section>

        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Medición de impacto a corto y mediano plazo
            </h3>
          </div>

          <TextareaField
            label="¿Qué resultados inmediatos se observaron?"
            required
            name="resultados_inmediatos"
            value={form.resultados_inmediatos}
            onChange={handleChange}
          />

          <TextareaField
            label="¿Qué efectos se evidencian en el mediano plazo?"
            required
            name="efectos_mediano_plazo"
            value={form.efectos_mediano_plazo}
            onChange={handleChange}
          />

          <TextareaField
            label="¿Cómo se vincula con el PIDE, SEAES u ODS?"
            required
            name="vinculacion_pide_seaes_ods"
            value={form.vinculacion_pide_seaes_ods}
            onChange={handleChange}
          />
        </section>

        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Estabilidad, sostenibilidad y posibilidad de réplica
            </h3>
          </div>

          <TextareaField
            label="¿Qué condiciones aseguran su permanencia?"
            required
            placeholder="Ej.: recursos humanos, presupuesto, apoyo institucional..."
            name="condiciones_permanencia"
            value={form.condiciones_permanencia}
            onChange={handleChange}
          />

          <TextareaField
            label="¿Qué aspectos son indispensables para implementarlas en otros contextos?"
            required
            name="aspectos_replicabilidad"
            value={form.aspectos_replicabilidad}
            onChange={handleChange}
          />
        </section>

        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Impacto institucional y aportaciones
            </h3>
          </div>

          <TextareaField
            label="¿De qué manera esta buena práctica, ha servido como motor de cambio para elevar los estándares de mejora continua en la institución?"
            required
            name="motor_cambio_mejora_continua"
            value={form.motor_cambio_mejora_continua}
            onChange={handleChange}
          />

          <TextareaField
            label="¿Qué acciones o estrategias se derivan de esta práctica?"
            required
            name="acciones_estrategias_derivadas"
            value={form.acciones_estrategias_derivadas}
            onChange={handleChange}
          />
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
  );
}

function TextareaField({
  label,
  required = false,
  hint = "",
  placeholder = "",
  name,
  value,
  onChange,
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
        rows={5}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      />
    </div>
  );
}