import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import { useBuenaPractica } from "../../hooks/useBuenaPractica";

const initialForm = {
  vinculacion_modelo_educativo: "",
  fundamentacion_teorica: "",
  politica_institucional: "",
};

export default function FundamentacionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { buenaPractica, loading, error } = useBuenaPractica(id);

  const [form, setForm] = useState(initialForm);
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const [catalogoModelo, setCatalogoModelo] = useState([]);
  const [catalogoPlanMexico, setCatalogoPlanMexico] = useState([]);
  const [catalogoOds, setCatalogoOds] = useState([]);
  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  const [modeloSeleccionado, setModeloSeleccionado] = useState([]);
  const [planMexicoSeleccionado, setPlanMexicoSeleccionado] = useState([]);
  const [odsSeleccionados, setOdsSeleccionados] = useState([]);

  useEffect(() => {
    async function loadCatalogos() {
      try {
        setLoadingCatalogos(true);

        const [modeloRes, planRes, odsRes] = await Promise.all([
          apiFetch("/api/v1/modelo-educativo-elementos").catch(() => ({ data: [] })),
          apiFetch("/api/v1/plan-mexico-sectores").catch(() => ({ data: [] })),
          apiFetch("/api/v1/ods").catch(() => ({ data: [] })),
        ]);

        setCatalogoModelo(modeloRes.data || []);
        setCatalogoPlanMexico(planRes.data || []);
        setCatalogoOds(odsRes.data || []);
      } catch (err) {
        setSaveError(err.message || "No se pudieron cargar los catálogos.");
      } finally {
        setLoadingCatalogos(false);
      }
    }

    loadCatalogos();
  }, []);

  useEffect(() => {
    if (!buenaPractica) return;

    const fundamentacion = buenaPractica.buena_practica_fundamentacion;

    setForm({
      vinculacion_modelo_educativo:
        fundamentacion?.vinculacion_modelo_educativo || "",
      fundamentacion_teorica: fundamentacion?.fundamentacion_teorica || "",
      politica_institucional: fundamentacion?.politica_institucional || "",
    });

    if (Array.isArray(buenaPractica.buena_practica_modelo_educativo_elemento)) {
      setModeloSeleccionado(
        buenaPractica.buena_practica_modelo_educativo_elemento.map((item) =>
          Number(item.catalogo_modelo_educativo_elemento_id)
        )
      );
    } else {
      setModeloSeleccionado([]);
    }

    if (Array.isArray(buenaPractica.buena_practica_plan_mexico_sector)) {
      setPlanMexicoSeleccionado(
        buenaPractica.buena_practica_plan_mexico_sector.map((item) =>
          Number(item.catalogo_plan_mexico_sector_id)
        )
      );
    } else {
      setPlanMexicoSeleccionado([]);
    }

    if (Array.isArray(buenaPractica.buena_practica_ods)) {
      setOdsSeleccionados(
        buenaPractica.buena_practica_ods.map((item) =>
          Number(item.catalogo_ods_id)
        )
      );
    } else {
      setOdsSeleccionados([]);
    }
  }, [buenaPractica]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function toggleSelected(idValue, setter) {
    const numericId = Number(idValue);

    setter((prev) =>
      prev.includes(numericId)
        ? prev.filter((item) => item !== numericId)
        : [...prev, numericId]
    );
  }

  async function saveForm(goNext = false) {
    setSaveError("");
    setSuccess("");

    try {
      setSaving(true);

        await apiFetch(`/api/v1/buenas-practicas/${id}/fundamentacion`, {
        method: "PATCH",
        body: JSON.stringify({
            ...form,
            modelo_educativo_elementos: modeloSeleccionado,
            plan_mexico_sectores: planMexicoSeleccionado,
            ods: odsSeleccionados,
        }),
        });

      if (goNext) {
        navigate(`/app/ficha/${id}/metodologia`);
        return;
      }

      setSuccess(
        "Fundamentación guardada correctamente."
      );
    } catch (err) {
      setSaveError(
        err.message || "No fue posible guardar la información de fundamentación."
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
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">
          3. Fundamentación
        </h2>

        <div className="space-y-1 text-sm leading-6 text-slate-600">
          <p>
            Bases teóricas, institucionales y criterios que sustentan la práctica.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Fundamentación institucional */}
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Fundamentación institucional
            </h3>
          </div>

          <TextareaField
            label="¿Cómo se vincula la buena práctica con el modelo educativo?"
            name="vinculacion_modelo_educativo"
            value={form.vinculacion_modelo_educativo}
            onChange={handleChange}
            hint="Describe cómo esta acción se conecta con los fundamentos de nuestra enseñanza y de qué manera beneficia el aprendizaje."
          />
        </section>

        {/* Fundamentación de la buena práctica */}
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Fundamentación de la buena práctica <span className="text-red-500">*</span>
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Selecciona una opción. Si la práctica se basa en una política institucional, no es necesario detallar la fundamentación teórica.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <TextareaField
              label="Fundamentación teórica"
              name="fundamentacion_teorica"
              value={form.fundamentacion_teorica}
              onChange={handleChange}
              hint="Teorías, enfoques, modelos o marcos conceptuales que sustentan la práctica (cita o referencia breve)."
            />

            <TextareaField
              label="Política institucional"
              name="politica_institucional"
              value={form.politica_institucional}
              onChange={handleChange}
              hint="Lineamientos o políticas internas que respaldan la práctica (menciona el documento)."
            />
          </div>

          <TagSection
            title="Elementos conceptuales y directrices del modelo educativo"
            hint="Seleccione los elementos conceptuales y directrices del modelo educativo que sustentan esta práctica o proyecto, se puede elegir más de uno para darle soporte a la fundamentación."
            items={catalogoModelo}
            selected={modeloSeleccionado}
            onToggle={(idItem) => toggleSelected(idItem, setModeloSeleccionado)}
            loading={loadingCatalogos}
            tone="blue"
            getLabel={(item) => item.nombre}
          />
        </section>

        {/* Vinculación sectorial y global */}
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Vinculación sectorial y global
            </h3>
          </div>

          <TagSection
            title="Sectores estratégicos (Plan México)"
            hint="Seleccione los sectores estratégicos con los que se vincula la práctica."
            items={catalogoPlanMexico}
            selected={planMexicoSeleccionado}
            onToggle={(idItem) => toggleSelected(idItem, setPlanMexicoSeleccionado)}
            loading={loadingCatalogos}
            tone="emerald"
            getLabel={(item) => item.nombre}
          />

          <TagSection
            title="Objetivos de Desarrollo Sostenible (ONU)"
            hint="Seleccione los objetivos con los que se alinea esta práctica."
            items={catalogoOds}
            selected={odsSeleccionados}
            onToggle={(idItem) => toggleSelected(idItem, setOdsSeleccionados)}
            loading={loadingCatalogos}
            tone="amber"
            getLabel={(item) => `${item.numero}. ${item.nombre}`}
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
            Puedes guardar el avance actual como borrador o guardar y continuar al
            siguiente apartado de la ficha.
          </p>

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
        </div>
      </form>
    </div>
  );
}

function TextareaField({
  label,
  name,
  value,
  onChange,
  hint = "",
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700">
        {label}
      </label>

      {hint ? <p className="mb-2 text-xs text-slate-500">{hint}</p> : null}

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
      />
    </div>
  );
}

function TagSection({
  title,
  hint = "",
  items,
  selected,
  onToggle,
  loading = false,
  tone = "slate",
  getLabel,
}) {
  const stylesByTone = {
    slate: {
      selected: "border-slate-900 bg-slate-900 text-white",
      unselected: "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
    },
    blue: {
      selected: "border-blue-700 bg-blue-700 text-white",
      unselected: "border-blue-200 bg-white text-blue-800 hover:bg-blue-50",
    },
    emerald: {
      selected: "border-emerald-700 bg-emerald-700 text-white",
      unselected:
        "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50",
    },
    amber: {
      selected: "border-amber-600 bg-amber-500 text-white",
      unselected:
        "border-amber-200 bg-white text-amber-800 hover:bg-amber-50",
    },
  };

  const styles = stylesByTone[tone] || stylesByTone.slate;

  return (
    <div className="space-y-3">
      <div>
        <h4 className="text-sm font-medium text-slate-700">{title}</h4>
        {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {loading ? (
          <p className="text-sm text-slate-500">Cargando opciones...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-slate-500">Sin opciones disponibles.</p>
        ) : (
          items.map((item) => {
            const itemId = Number(item.id);
            const isSelected = selected.includes(itemId);

            return (
              <button
                key={itemId}
                type="button"
                onClick={() => onToggle(itemId)}
                className={[
                  "rounded-full border px-3 py-2 text-sm transition",
                  isSelected ? styles.selected : styles.unselected,
                ].join(" ")}
              >
                {getLabel(item)}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}