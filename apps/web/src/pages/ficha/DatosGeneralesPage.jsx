import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getUser } from "../../lib/auth";
import { apiFetch } from "../../lib/api";
import { useBuenaPractica } from "../../hooks/useBuenaPractica";
import { Trash2 } from "lucide-react";
import { useOutletContext } from "react-router-dom";

const initialForm = {
  titulo: "",
  subtitulo_lema: "",
  descripcion_breve: "",
  unidad_organizacional_id: "",
  periodo_implementacion: "",
};

const responsableVacio = {
  nombre: "",
  cargo: "",
  correo: "",
  telefono: "",
};



export default function DatosGeneralesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = getUser();

  const { buenaPractica, loading, error, reload } = useBuenaPractica(id);

  const [unidades, setUnidades] = useState([]);
  const [catalogoAlineacion, setCatalogoAlineacion] = useState([]);

  const [loadingCatalogos, setLoadingCatalogos] = useState(true);

  const [form, setForm] = useState(initialForm);
  const [responsableForm, setResponsableForm] = useState(responsableVacio);
  const [responsables, setResponsables] = useState([]);

  const [alineacionesSeleccionadas, setAlineacionesSeleccionadas] = useState([]);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");

  const { reloadValidacion, canEdit } = useOutletContext();


  useEffect(() => {
    async function loadCatalogos() {
      try {
        setLoadingCatalogos(true);

        const [unidadesRes, alineacionRes] = await Promise.all([
          apiFetch("/api/v1/unidades-organizacionales"),
          apiFetch("/api/v1/alineaciones").catch(() => ({ data: [] })),
        ]);

        setUnidades(unidadesRes.data || []);
        setCatalogoAlineacion(alineacionRes.data || []);
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

    setForm({
      titulo: buenaPractica.titulo || "",
      subtitulo_lema:
        buenaPractica.buena_practica_datos_generales?.subtitulo_lema || "",
      descripcion_breve: buenaPractica.descripcion_breve || "",
      unidad_organizacional_id: buenaPractica.unidad_organizacional_id
        ? String(buenaPractica.unidad_organizacional_id)
        : "",
      periodo_implementacion:
        buenaPractica.buena_practica_datos_generales?.periodo_implementacion || "",
    });

    // Responsables y alineaciones se conectarán con el endpoint ampliado.
    // Por ahora, si no vienen del GET, dejamos valores iniciales seguros.
    if (
    Array.isArray(buenaPractica.buena_practica_responsable) &&
    buenaPractica.buena_practica_responsable.length > 0
    ) {
    setResponsables(
        buenaPractica.buena_practica_responsable.map((item) => ({
        nombre: item.nombre || "",
        cargo: item.cargo || "",
        correo: item.correo || "",
        telefono: item.telefono || "",
        }))
    );
    } else {
    setResponsables([]);
    }

    setResponsableForm({ ...responsableVacio });

    if (Array.isArray(buenaPractica.buena_practica_alineacion)) {
      setAlineacionesSeleccionadas(
        buenaPractica.buena_practica_alineacion.map((item) => item.catalogo_alineacion_id)
      );
    } else {
      setAlineacionesSeleccionadas([]);
    }
  }, [buenaPractica]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleAddResponsable() {
    if (!responsableForm.nombre.trim()) {
        setSaveError("Agrega al menos el nombre de la persona responsable.");
        return;
    }

    setSaveError("");

    setResponsables((prev) => [
        ...prev,
        {
        nombre: responsableForm.nombre.trim(),
        cargo: responsableForm.cargo.trim(),
        correo: responsableForm.correo.trim(),
        telefono: responsableForm.telefono.trim(),
        },
    ]);

    setResponsableForm({ ...responsableVacio });
    }

    function handleRemoveResponsable(index) {
    setResponsables((prev) => prev.filter((_, i) => i !== index));
    }

  function toggleAlineacion(idAlineacion) {
    setAlineacionesSeleccionadas((prev) =>
      prev.includes(idAlineacion)
        ? prev.filter((id) => id !== idAlineacion)
        : [...prev, idAlineacion]
    );
  }

  const grupos = useMemo(() => {
    const base = {
      FUNCION_SUSTANTIVA: [],
      CRITERIO_SEAES: [],
      PROGRAMA_SECTORIAL: [],
      EJE_TRANSVERSAL: [],
    };

    for (const item of catalogoAlineacion) {
      if (base[item.grupo]) {
        base[item.grupo].push(item);
      }
    }

    return base;
  }, [catalogoAlineacion]);

  async function saveForm(goNext = false) {
    setSaveError("");
    setSuccess("");

    try {
      setSaving(true);

      await apiFetch(`/api/v1/buenas-practicas/${id}/datos-generales`, {
        method: "PATCH",
        body: JSON.stringify({
          ...form,
          unidad_organizacional_id: Number(form.unidad_organizacional_id),
          actualizado_por_id: user?.id,
          responsables,
          alineaciones: alineacionesSeleccionadas,
        }),
      });

      
      await reloadValidacion();
      if (goNext) {
        navigate(`/app/ficha/${id}/contexto`, { replace: false });
        return;
      }

      await reload();
      setSuccess("Datos generales actualizados correctamente.");
    } catch (err) {
      setSaveError(err.message || "No fue posible actualizar los datos generales.");
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
      {/* Encabezado */}
      {!canEdit ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          La ficha se encuentra en <strong>{buenaPractica?.buena_practica_estatus?.nombre}</strong> y actualmente no permite edición.
        </div>
      ) : null}
    <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">
            1. Datos generales
        </h2>

        <div className="space-y-1 text-sm leading-6 text-slate-600">
            <p>Información básica de identificación de la buena práctica</p>
            <p>
            Captura y actualiza la información general que permite identificar la
            buena práctica y ubicarla dentro del marco institucional y estratégico.
            </p>
        </div>
    </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Sección: Identificación */}
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Identificación</h3>
            <p className="mt-1 text-sm text-slate-500">
              Registra los datos básicos que permiten reconocer la práctica.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Título de la buena práctica <span className="text-red-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">
              Proporcione un título claro y descriptivo.
            </p>
            <input
              name="titulo"
              value={form.titulo}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Subtítulo o lema
            </label>
            <p className="mb-2 text-xs text-slate-500">
              Opcional: frase breve que complemente el título.
            </p>
            <input
              name="subtitulo_lema"
              value={form.subtitulo_lema}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Descripción breve <span className="text-red-500">*</span>
            </label>
            <textarea
              name="descripcion_breve"
              value={form.descripcion_breve}
              onChange={handleChange}
              rows={4}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>

        <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
                Unidad organizacional <span className="text-red-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">
                Selecciona la unidad organizacional responsable de la buena práctica.
            </p>
            <select
                name="unidad_organizacional_id"
                value={form.unidad_organizacional_id}
                onChange={handleChange}
                disabled={loadingCatalogos}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
                <option value="">
                {loadingCatalogos ? "Cargando..." : "Seleccione una unidad organizacional"}
                </option>
                {unidades.map((unidad) => (
                <option key={unidad.id} value={unidad.id}>
                    {unidad.nombre}
                </option>
                ))}
            </select>
        </div>


            <div className="space-y-4">
            <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                Personas responsables <span className="text-red-500">*</span>
                </label>
                <p className="mb-2 text-xs text-slate-500">
                Agrega una o más personas responsables de la buena práctica.
                </p>
            </div>

            {/* Formulario compacto */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Nombre
                    </label>
                    <input
                    value={responsableForm.nombre}
                    onChange={(e) =>
                        setResponsableForm((prev) => ({ ...prev, nombre: e.target.value }))
                    }
                    placeholder="Nombre completo"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Cargo
                    </label>
                    <input
                    value={responsableForm.cargo}
                    onChange={(e) =>
                        setResponsableForm((prev) => ({ ...prev, cargo: e.target.value }))
                    }
                    placeholder="Cargo"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Correo
                    </label>
                    <input
                    value={responsableForm.correo}
                    onChange={(e) =>
                        setResponsableForm((prev) => ({ ...prev, correo: e.target.value }))
                    }
                    placeholder="Correo"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Teléfono
                    </label>
                    <input
                    value={responsableForm.telefono}
                    onChange={(e) =>
                        setResponsableForm((prev) => ({ ...prev, telefono: e.target.value }))
                    }
                    placeholder="Teléfono"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    />
                </div>
                </div>

                <div className="mt-4 flex justify-end">
                <button
                    type="button"
                    onClick={handleAddResponsable}
                    className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                    Agregar responsable
                </button>
                </div>
            </div>

            {/* Tabla */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                <h4 className="text-sm font-semibold text-slate-800">
                    Responsables agregados
                </h4>
                </div>

                {responsables.length === 0 ? (
                <div className="px-4 py-6 text-sm text-slate-500">
                    No se han agregado responsables aún.
                </div>
                ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                        <th className="px-4 py-3 text-left font-medium">Nombre</th>
                        <th className="px-4 py-3 text-left font-medium">Cargo</th>
                        <th className="px-4 py-3 text-left font-medium">Correo</th>
                        <th className="px-4 py-3 text-left font-medium">Teléfono</th>
                        <th className="px-4 py-3 text-center font-medium">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {responsables.map((responsable, index) => (
                        <tr key={index} className="border-t border-slate-200">
                            <td className="px-4 py-3 text-slate-800">{responsable.nombre}</td>
                            <td className="px-4 py-3 text-slate-700">
                            {responsable.cargo || "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                            {responsable.correo || "—"}
                            </td>
                            <td className="px-4 py-3 text-slate-700">
                            {responsable.telefono || "—"}
                            </td>
                            <td className="px-4 py-3 text-center">
                            <button
                                type="button"
                                onClick={() => handleRemoveResponsable(index)}
                                className="inline-flex rounded-lg p-2 text-red-600 transition hover:bg-red-50 hover:text-red-700"
                                aria-label="Eliminar responsable"
                                title="Eliminar"
                                >
                                <Trash2 size={16} />
                            </button>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                )}
            </div>
            </div>
        </section>

        {/* Sección: Categoría de inscripción */}
        <section className="space-y-6 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Categoría de inscripción de la buena práctica
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Selecciona etiquetas para ubicar la práctica en el marco sustantivo
              (Funciones/SEAES) y, si aplica, en el marco estratégico (PIDE).
            </p>
          </div>

          {/* Alineación institucional */}
          <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/40 p-4">
            <div>
                <h4 className="text-base font-semibold text-slate-800">
                Alineación institucional (Funciones sustantivas y criterios SEAES)
                </h4>
                <p className="mt-1 text-sm text-slate-500">
                Selecciona una o más opciones en cada grupo, según corresponda.
                </p>
            </div>

            <TagSection
                title="Funciones sustantivas"
                hint="Selecciona las funciones sustantivas con las que se relaciona la práctica."
                items={grupos.FUNCION_SUSTANTIVA}
                selected={alineacionesSeleccionadas}
                onToggle={toggleAlineacion}
                tone="blue"
            />

            <TagSection
                title="Criterios SEAES"
                hint="Selecciona los criterios SEAES que correspondan a la práctica."
                items={grupos.CRITERIO_SEAES}
                selected={alineacionesSeleccionadas}
                onToggle={toggleAlineacion}
                tone="blue"
            />
        </div>

          {/* Alineación estratégica */}
            <div className="space-y-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
                <div>
                    <h4 className="text-base font-semibold text-slate-800">
                    Alineación estratégica institucional (PIDE)
                    </h4>
                    <p className="mt-1 text-sm text-slate-500">
                    Selecciona las opciones estratégicas que correspondan a la práctica.
                    </p>
                </div>

                <TagSection
                    title="Programas sectoriales"
                    hint="Selecciona los programas sectoriales con los que se alinea la práctica."
                    items={grupos.PROGRAMA_SECTORIAL}
                    selected={alineacionesSeleccionadas}
                    onToggle={toggleAlineacion}
                    tone="emerald"
                />

                <TagSection
                    title="Ejes transversales"
                    hint="Selecciona los ejes transversales aplicables."
                    items={grupos.EJE_TRANSVERSAL}
                    selected={alineacionesSeleccionadas}
                    onToggle={toggleAlineacion}
                    tone="emerald"
                />
            </div>
        </section>

        {/* Sección: Temporalidad y estado */}
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Temporalidad y estado
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Registra los datos temporales básicos de la práctica.
            </p>
          </div>



          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Periodo de implementación <span className="text-red-500">*</span>
            </label>
            <input
              name="periodo_implementacion"
              value={form.periodo_implementacion}
              onChange={handleChange}
              placeholder="Ej. 2024 - 2025"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </section>

        {/* Mensajes */}
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

        {/* Acciones */}
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

function TagSection({
  title,
  items,
  selected,
  onToggle,
  hint = "",
  tone = "slate",
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
  };

  const styles = stylesByTone[tone] || stylesByTone.slate;

  return (
    <div className="space-y-3">
      <div>
        <h5 className="text-sm font-medium text-slate-700">{title}</h5>
        {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {items.length === 0 ? (
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
                {item.valor}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}