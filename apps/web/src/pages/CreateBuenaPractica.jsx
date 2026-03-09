import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppShell from "../components/layout/AppShell";
import { apiFetch } from "../lib/api";
import { getUser } from "../lib/auth";

const initialForm = {
  titulo: "",
  unidad_organizacional_id: "",
  descripcion_breve: "",
  subtitulo_lema: "",
  periodo_implementacion: "",
};

export default function CreateBuenaPractica() {
  const navigate = useNavigate();
  const user = getUser();

  const [mode, setMode] = useState("nueva");
  const [form, setForm] = useState(initialForm);
  const [unidades, setUnidades] = useState([]);
  const [loadingUnidades, setLoadingUnidades] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadUnidades() {
      try {
        setLoadingUnidades(true);
        const response = await apiFetch("/api/v1/unidades-organizacionales");
        setUnidades(response.data || []);
      } catch (err) {
        setError(err.message || "No se pudieron cargar las unidades organizacionales.");
      } finally {
        setLoadingUnidades(false);
      }
    }

    loadUnidades();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (mode !== "nueva") {
      setError("Por ahora solo está habilitada la creación desde cero.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        ...form,
        unidad_organizacional_id: Number(form.unidad_organizacional_id),
        tipo_registro: "NUEVA",
        creado_por_id: user?.id,
      };

      const response = await apiFetch("/api/v1/buenas-practicas", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const nuevaPracticaId = response?.data?.buena_practica?.id;

      setSuccess("Buena práctica creada correctamente.");

      if (nuevaPracticaId) {
        // navigate(`/app/ficha/${nuevaPracticaId}`, { replace: true });
        navigate(`/app/ficha/${nuevaPracticaId}/datos-generales`, {
            replace: true
        });
      }
    } catch (err) {
      setError(err.message || "No fue posible crear la buena práctica.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell title="Crear buena práctica">
      <div className="space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            Crear una nueva buena práctica
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Selecciona la modalidad de registro. En esta primera etapa trabajaremos
            con la creación desde cero y posteriormente se integrará el flujo para
            adoptar o adaptar una práctica existente.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setMode("nueva")}
              className={[
                "rounded-2xl border p-5 text-left transition",
                mode === "nueva"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100",
              ].join(" ")}
            >
              <div className="text-base font-semibold">Crear desde cero</div>
              <p className="mt-2 text-sm leading-6 opacity-90">
                Registra una buena práctica nueva para comenzar su captura y
                continuar con el llenado de la ficha.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setMode("adoptar")}
              className={[
                "rounded-2xl border p-5 text-left transition",
                mode === "adoptar"
                  ? "border-slate-900 bg-slate-900 text-white"
                  : "border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-base font-semibold">
                  Seleccionar una práctica existente
                </span>
                <span className="rounded-full border border-current px-2 py-1 text-xs">
                  Próximamente
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 opacity-90">
                Permitirá adoptar o adaptar una práctica ya registrada dentro del
                sistema.
              </p>
            </button>
          </div>
        </section>

        {mode === "nueva" && (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">
              Datos iniciales de la buena práctica
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Completa la información básica para crear el registro inicial.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Título
                </label>
                <input
                  name="titulo"
                  value={form.titulo}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Unidad organizacional
                </label>
                <select
                  name="unidad_organizacional_id"
                  value={form.unidad_organizacional_id}
                  onChange={handleChange}
                  disabled={loadingUnidades}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">
                    {loadingUnidades ? "Cargando..." : "Seleccione una unidad organizacional"}
                  </option>
                  {unidades.map((unidad) => (
                    <option key={unidad.id} value={unidad.id}>
                      {unidad.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Descripción breve
                </label>
                <textarea
                  name="descripcion_breve"
                  value={form.descripcion_breve}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Subtítulo o lema
                </label>
                <input
                  name="subtitulo_lema"
                  value={form.subtitulo_lema}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Periodo de implementación
                </label>
                <input
                  name="periodo_implementacion"
                  value={form.periodo_implementacion}
                  onChange={handleChange}
                  placeholder="Ej. 2024 - 2025"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  {success}
                </div>
              ) : null}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving ? "Creando..." : "Crear buena práctica"}
                </button>
              </div>
            </form>
          </section>
        )}

        {mode === "adoptar" && (
          <section className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6">
            <h3 className="text-lg font-bold text-slate-900">
              Adoptar o adaptar una práctica existente
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Este flujo se integrará en el siguiente paso del desarrollo.
            </p>
          </section>
        )}
      </div>
    </AppShell>
  );
}