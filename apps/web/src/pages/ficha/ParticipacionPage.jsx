import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { apiFetch } from "../../lib/api";
import { useBuenaPractica } from "../../hooks/useBuenaPractica";
import { useOutletContext } from "react-router-dom";

const initialActorForm = {
  nombre: "",
  rol: "",
  unidad: "",
};

const initialForm = {
  descripcion_coordinacion: "",
  aportes_interdisciplinarios: "",
};

export default function ParticipacionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { buenaPractica, loading, error } = useBuenaPractica(id);

  const [actors, setActors] = useState([]);
  const [actorForm, setActorForm] = useState(initialActorForm);
  const [form, setForm] = useState(initialForm);

  const [saveError, setSaveError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const { reloadValidacion, canEdit } = useOutletContext();

  useEffect(() => {
    if (!buenaPractica) return;

    if (Array.isArray(buenaPractica.buena_practica_actor_involucrado)) {
      setActors(
        buenaPractica.buena_practica_actor_involucrado.map((item) => ({
          id: item.id,
          nombre: item.nombre || "",
          rol: item.rol || "",
          unidad:
            item.unidad_organizacional?.nombre ||
            item.unidad_organizacional_texto ||
            "",
        }))
      );
    } else {
      setActors([]);
    }

    const participacion = buenaPractica.buena_practica_participacion_colaboracion;

    setForm({
      descripcion_coordinacion:
        participacion?.descripcion_coordinacion || "",
      aportes_interdisciplinarios:
        participacion?.aportes_interdisciplinarios || "",
    });

    setActorForm(initialActorForm);
  }, [buenaPractica]);

  function handleActorFormChange(event) {
    const { name, value } = event.target;
    setActorForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleFormChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleAddActor() {
    if (!actorForm.nombre.trim()) {
      setSaveError("Agrega al menos el nombre del actor involucrado.");
      return;
    }

    setSaveError("");

    setActors((prev) => [
      ...prev,
      {
        tempId: Date.now(),
        nombre: actorForm.nombre.trim(),
        rol: actorForm.rol.trim(),
        unidad: actorForm.unidad.trim(),
      },
    ]);

    setActorForm(initialActorForm);
  }

  function handleRemoveActor(index) {
    setActors((prev) => prev.filter((_, i) => i !== index));
  }

  async function saveForm(goNext = false) {
    setSaveError("");
    setSuccess("");

    try {
      setSaving(true);

        await apiFetch(`/api/v1/buenas-practicas/${id}/participacion`, {
        method: "PATCH",
        body: JSON.stringify({
            actores: actors,
            descripcion_coordinacion: form.descripcion_coordinacion,
            aportes_interdisciplinarios: form.aportes_interdisciplinarios,
        }),
        });

        await reloadValidacion();
      if (goNext) {
        navigate(`/app/ficha/${id}/evaluacion`);
        return;
      }

      setSuccess(
        "Participación y colaboración guardadas correctamente."
      );
    } catch (err) {
      setSaveError(
        err.message ||
          "No fue posible guardar la información de participación y colaboración."
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
      {/* Encabezado */}
      {!canEdit ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          La ficha se encuentra en <strong>{buenaPractica?.buena_practica_estatus?.nombre}</strong> y actualmente no permite edición.
        </div>
      ) : null}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-slate-900">
          2.6 Participación y colaboración
        </h2>

        <div className="space-y-1 text-sm leading-6 text-slate-600">
          <p>Actores involucrados y dinámica de trabajo colaborativo.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Actores involucrados */}
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Actores involucrados
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Registra a las personas o perfiles que participaron en la práctica,
              indicando su rol y la unidad organizacional o programa educativo al
              que pertenecen.
            </p>
          </div>

          {/* Formulario compacto */}
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Actor / Nombre
                </label>
                <input
                  name="nombre"
                  value={actorForm.nombre}
                  onChange={handleActorFormChange}
                  placeholder="Nombre completo"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Rol
                </label>
                <input
                  name="rol"
                  value={actorForm.rol}
                  onChange={handleActorFormChange}
                  placeholder="Coordinador, colaborador..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Unidad organizacional o programa educativo
                </label>
                <input
                  name="unidad"
                  value={actorForm.unidad}
                  onChange={handleActorFormChange}
                  placeholder="Unidad organizacional o programa educativo"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleAddActor}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Agregar actor
              </button>
            </div>
          </div>

          {/* Tabla */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
              <h4 className="text-sm font-semibold text-slate-800">
                Actores agregados
              </h4>
            </div>

            {actors.length === 0 ? (
              <div className="px-4 py-6 text-sm text-slate-500">
                No se han agregado actores aún.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">
                        Actor / Nombre
                      </th>
                      <th className="px-4 py-3 text-left font-medium">Rol</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Unidad organizacional o programa educativo
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {actors.map((actor, index) => (
                      <tr
                        key={actor.id || actor.tempId}
                        className="border-t border-slate-200"
                      >
                        <td className="px-4 py-3 text-slate-800">
                          {actor.nombre}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {actor.rol || "—"}
                        </td>
                        <td className="px-4 py-3 text-slate-700">
                          {actor.unidad || "—"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveActor(index)}
                            className="inline-flex rounded-lg p-2 text-red-600 transition hover:bg-red-50 hover:text-red-700"
                            aria-label="Eliminar actor"
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
        </section>

        {/* Coordinación y colaboración */}
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Coordinación y colaboración
            </h3>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Descripción de la coordinación del trabajo colaborativo{" "}
              <span className="text-red-500">*</span>
            </label>
            <p className="mb-2 text-xs text-slate-500">
              Explique cómo se organizó y coordinó el trabajo entre los diferentes actores.
            </p>
            <textarea
              name="descripcion_coordinacion"
              value={form.descripcion_coordinacion}
              onChange={handleFormChange}
              rows={6}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
        </section>

        {/* Aportes interdisciplinarios */}
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50/60 p-5">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Aportes interdisciplinarios
            </h3>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Aportes interdisciplinarios
            </label>
            <p className="mb-2 text-xs text-slate-500">
              Describa aportes interdisciplinarios encontrados o definidos.
            </p>
            <textarea
              name="aportes_interdisciplinarios"
              value={form.aportes_interdisciplinarios}
              onChange={handleFormChange}
              rows={6}
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