import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { useBuenaPractica } from "../../hooks/useBuenaPractica";
import { useOutletContext } from "react-router-dom";

const initialForm = {
  fortalezas: "",
  oportunidades: "",
  debilidades: "",
  amenazas: "",
  estrategias_derivadas: "",
};

export default function FodaPage() {
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

    const foda = buenaPractica.buena_practica_foda;

    setForm({
      fortalezas: foda?.fortalezas || "",
      oportunidades: foda?.oportunidades || "",
      debilidades: foda?.debilidades || "",
      amenazas: foda?.amenazas || "",
      estrategias_derivadas: foda?.estrategias_derivadas || "",
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

        await apiFetch(`/api/v1/buenas-practicas/${id}/foda`, {
        method: "PATCH",
        body: JSON.stringify(form),
        });

        await reloadValidacion();
      if (goNext) {
        navigate(`/app/ficha/${id}/participacion`);
        return;
      }

      setSuccess("Análisis FODA guardado correctamente.");
    } catch (err) {
      setSaveError(
        err.message || "No fue posible guardar la información del análisis FODA."
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
          2.5 Análisis FODA
        </h2>

        <div className="space-y-1 text-sm leading-6 text-slate-600">
          <p>Análisis de Fortalezas, Oportunidades, Debilidades y Amenazas.</p>
          <p>
            Identifica factores internos y externos que influyen en el desarrollo,
            consolidación y sostenibilidad de la buena práctica.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Análisis</h3>
            <p className="mt-1 text-sm text-slate-500">
              Examina factores internos y externos que impactan la práctica.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <FodaField
              label="Fortalezas"
              required
              hint="Factores internos que favorecen la buena práctica."
              placeholder="Ej. Experiencia del equipo, apoyo institucional, recursos disponibles..."
              name="fortalezas"
              value={form.fortalezas}
              onChange={handleChange}
              tone="emerald"
            />

            <FodaField
              label="Oportunidades"
              required
              hint="Factores externos que pueden ser aprovechados."
              placeholder="Ej. Alianzas potenciales, tendencias favorables, financiamiento disponible..."
              name="oportunidades"
              value={form.oportunidades}
              onChange={handleChange}
              tone="blue"
            />

            <FodaField
              label="Debilidades"
              required
              hint="Aspectos internos que limitan o dificultan la práctica."
              placeholder="Ej. Limitaciones de recursos, procesos por mejorar, brechas de capacidades..."
              name="debilidades"
              value={form.debilidades}
              onChange={handleChange}
              tone="amber"
            />

            <FodaField
              label="Amenazas"
              required
              hint="Factores externos que representan riesgos para la continuidad o efectividad."
              placeholder="Ej. Restricciones presupuestarias, cambios normativos, situaciones externas adversas..."
              name="amenazas"
              value={form.amenazas}
              onChange={handleChange}
              tone="rose"
            />
          </div>
        </section>

        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Estrategias derivadas
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Opcional: describe estrategias que surgen del análisis FODA.
            </p>
          </div>

          <div>
            <p className="mb-2 text-xs text-slate-500">
              Puedes orientar las estrategias con combinaciones como:
              <br />
              FO: aprovechar fortalezas para potenciar oportunidades
              <br />
              FA: usar fortalezas para enfrentar amenazas
              <br />
              DO: superar debilidades aprovechando oportunidades
              <br />
              DA: minimizar debilidades para reducir amenazas
            </p>

            <textarea
              name="estrategias_derivadas"
              value={form.estrategias_derivadas}
              onChange={handleChange}
              rows={6}
              placeholder={`Ej:
• Estrategia FO: Aprovechar...
• Estrategia FA: Usar... para contrarrestar...
• Estrategia DO: Mejorar... aprovechando...
• Estrategia DA: Reducir... ante...`}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-mono text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
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
  );
}

function FodaField({
  label,
  required = false,
  hint = "",
  placeholder = "",
  name,
  value,
  onChange,
  tone = "slate",
}) {
  const toneClasses = {
    slate: "border-slate-200 bg-slate-50/40",
    emerald: "border-emerald-200 bg-emerald-50/40",
    blue: "border-blue-200 bg-blue-50/40",
    amber: "border-amber-200 bg-amber-50/40",
    rose: "border-rose-200 bg-rose-50/40",
  };
  const { canEdit } = useOutletContext();
  return (
    <div className={`rounded-2xl border p-4 ${toneClasses[tone] || toneClasses.slate}`}>
      <label className="mb-2 block text-sm font-semibold text-slate-800">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>

      {hint ? <p className="mb-3 text-xs text-slate-500">{hint}</p> : null}

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={6}
        placeholder={placeholder}
        disabled={!canEdit}
        className={[
          "w-full rounded-xl px-4 py-3 outline-none",
          !canEdit
            ? `bg-slate-50 text-slate-700 border border-slate-200 cursor-default ${toneClasses[tone] || toneClasses.slate}`
            : "border border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        ].join(" ")}
        // className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      />
    </div>
  );
}