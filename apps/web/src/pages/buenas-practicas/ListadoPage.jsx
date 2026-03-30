import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Eye, Pencil, Search, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiFetch } from "../../lib/api";
import AppShell from "../../components/layout/AppShell";

/* const MOCK_ALINEACIONES = [
  { id: 1, grupo: "FUNCION_SUSTANTIVA", nombre: "Docencia" },
  { id: 2, grupo: "FUNCION_SUSTANTIVA", nombre: "Investigación" },
  { id: 3, grupo: "FUNCION_SUSTANTIVA", nombre: "Extensión" },

  { id: 10, grupo: "CRITERIO_SEAES", nombre: "Inclusión" },
  { id: 11, grupo: "CRITERIO_SEAES", nombre: "Equidad" },
  { id: 12, grupo: "CRITERIO_SEAES", nombre: "Excelencia" },

  { id: 20, grupo: "PROGRAMA_SECTORIAL", nombre: "Cultura de paz" },
  { id: 21, grupo: "PROGRAMA_SECTORIAL", nombre: "Universidad digital" },

  { id: 30, grupo: "EJE_TRANSVERSAL", nombre: "Sustentabilidad" },
  { id: 31, grupo: "EJE_TRANSVERSAL", nombre: "Internacionalización" },
];

const MOCK_UNIDADES = [
  { id: 1, nombre: "Facultad de Telemática" },
  { id: 2, nombre: "Facultad de Derecho" },
  { id: 3, nombre: "Facultad de Medicina" },
  { id: 4, nombre: "Facultad de Ciencias de la Educación" },
  { id: 5, nombre: "Delegación Colima" },
]; */

const PAGE_SIZE = 5;

export default function ListadoPage() {
  const navigate = useNavigate();

  const [alineacionesSeleccionadas, setAlineacionesSeleccionadas] = useState([]);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const [unidadInput, setUnidadInput] = useState("");
  const [unidadSeleccionada, setUnidadSeleccionada] = useState(null);
  const [unidadDropdownOpen, setUnidadDropdownOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const [practicas, setPracticas] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    limit: PAGE_SIZE,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [alineaciones, setAlineaciones] = useState([]);
  const [unidades, setUnidades] = useState([]);

  const popoverRef = useRef(null);
  const unidadRef = useRef(null);

  useEffect(() => {
    async function loadCatalogos() {
      try {
        const [resAlineaciones, resUnidades] = await Promise.all([
          apiFetch("/api/v1/alineaciones"),
          apiFetch("/api/v1/unidades-organizacionales"),
        ]);

        setAlineaciones(resAlineaciones.data || []);
        setUnidades(resUnidades.data || []);
      } catch (err) {
        console.error("Error cargando catálogos", err);
      }
    }

    loadCatalogos();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setPopoverOpen(false);
      }

      if (unidadRef.current && !unidadRef.current.contains(event.target)) {
        setUnidadDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    async function loadPracticas() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        params.set("page", String(page));
        params.set("limit", String(PAGE_SIZE));

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (unidadSeleccionada?.id) {
          params.set("unidad_id", String(unidadSeleccionada.id));
        }

        if (alineacionesSeleccionadas.length > 0) {
          params.set("alineaciones", alineacionesSeleccionadas.join(","));
        }

        const response = await apiFetch(
          `/api/v1/buenas-practicas?${params.toString()}`
        );

        setPracticas(response.data || []);
        setMeta(
          response.meta || {
            total: 0,
            page: 1,
            limit: PAGE_SIZE,
            totalPages: 1,
          }
        );
      } catch (err) {
        setError(
          err.message || "No se pudo cargar el listado de buenas prácticas."
        );
        setPracticas([]);
        setMeta({
          total: 0,
          page: 1,
          limit: PAGE_SIZE,
          totalPages: 1,
        });
      } finally {
        setLoading(false);
      }
    }

    loadPracticas();
  }, [page, search, unidadSeleccionada, alineacionesSeleccionadas]);

  useEffect(() => {
    setPage(1);
  }, [alineacionesSeleccionadas, unidadSeleccionada, search]);

  const alineacionesAgrupadas = useMemo(() => {
    return {
      FUNCION_SUSTANTIVA: alineaciones.filter(a => a.grupo === "FUNCION_SUSTANTIVA"),
      CRITERIO_SEAES: alineaciones.filter(a => a.grupo === "CRITERIO_SEAES"),
      PROGRAMA_SECTORIAL: alineaciones.filter(a => a.grupo === "PROGRAMA_SECTORIAL"),
      EJE_TRANSVERSAL: alineaciones.filter(a => a.grupo === "EJE_TRANSVERSAL"),
    };
  }, [alineaciones]);

  const alineacionesSeleccionadasDetalle = useMemo(() => {
    return alineaciones.filter((item) =>
      alineacionesSeleccionadas.includes(item.id)
    );
  }, [alineacionesSeleccionadas, alineaciones]);

  const unidadesFiltradas = useMemo(() => {
    const term = normalizeText(unidadInput.trim());

    if (!term) return unidades.slice(0, 8);

    return unidades
      .filter((unidad) => normalizeText(unidad.nombre).includes(term))
      .slice(0, 8);
  }, [unidadInput, unidades]);

  function toggleAlineacion(id) {
    setAlineacionesSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  }

  function clearAlineaciones() {
    setAlineacionesSeleccionadas([]);
  }

  function selectUnidad(unidad) {
    setUnidadSeleccionada(unidad);
    setUnidadInput(unidad.nombre);
    setUnidadDropdownOpen(false);
  }

  function clearUnidad() {
    setUnidadSeleccionada(null);
    setUnidadInput("");
  }

  function renderEstadoBadge(estatus) {
    const tone = getEstadoTone(estatus?.nombre);

    return (
      <span
        className={[
          "inline-flex rounded-full border px-3 py-1 text-xs font-medium",
          tone,
        ].join(" ")}
      >
        {estatus?.nombre || "Sin estatus"}
      </span>
    );
  }

  return (
    <AppShell title="Listado de buenas prácticas">
      <div className="space-y-6 p-4 md:p-6">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">
            Listado de Buenas Prácticas
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Gestión y seguimiento de buenas prácticas institucionales.
          </p>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="relative" ref={popoverRef}>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Inscripción
              </label>

              <button
                type="button"
                onClick={() => setPopoverOpen((prev) => !prev)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-300 bg-white px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <span className="truncate">
                  {alineacionesSeleccionadasDetalle.length > 0
                    ? `${alineacionesSeleccionadasDetalle.length} seleccionada(s)`
                    : "Selecciona una o más opciones"}
                </span>
                <ChevronDown size={16} />
              </button>

              {alineacionesSeleccionadasDetalle.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {alineacionesSeleccionadasDetalle.map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700"
                    >
                      {formatGrupoLabel(item.grupo)}: {item.valor}
                      <button
                        type="button"
                        onClick={() => toggleAlineacion(item.id)}
                        className="text-slate-500 hover:text-slate-700"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              {popoverOpen ? (
                <div className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">
                      Filtrar por inscripción
                    </p>

                    <button
                      type="button"
                      onClick={clearAlineaciones}
                      className="text-xs font-medium text-slate-500 hover:text-slate-700"
                    >
                      Limpiar
                    </button>
                  </div>

                  <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
                    <CheckboxGroup
                      title="Función sustantiva"
                      items={alineacionesAgrupadas.FUNCION_SUSTANTIVA}
                      selected={alineacionesSeleccionadas}
                      onToggle={toggleAlineacion}
                    />

                    <CheckboxGroup
                      title="Criterio SEAES"
                      items={alineacionesAgrupadas.CRITERIO_SEAES}
                      selected={alineacionesSeleccionadas}
                      onToggle={toggleAlineacion}
                    />

                    <CheckboxGroup
                      title="Programa sectorial"
                      items={alineacionesAgrupadas.PROGRAMA_SECTORIAL}
                      selected={alineacionesSeleccionadas}
                      onToggle={toggleAlineacion}
                    />

                    <CheckboxGroup
                      title="Eje transversal"
                      items={alineacionesAgrupadas.EJE_TRANSVERSAL}
                      selected={alineacionesSeleccionadas}
                      onToggle={toggleAlineacion}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            <div className="relative" ref={unidadRef}>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Unidad organizacional
              </label>

              <div className="relative">
                <input
                  type="text"
                  value={unidadInput}
                  onChange={(e) => {
                    setUnidadInput(e.target.value);
                    setUnidadDropdownOpen(true);
                    if (!e.target.value.trim()) {
                      setUnidadSeleccionada(null);
                    }
                  }}
                  onFocus={() => setUnidadDropdownOpen(true)}
                  placeholder="Escribe para buscar..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 pr-10 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />

                {unidadSeleccionada ? (
                  <button
                    type="button"
                    onClick={clearUnidad}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X size={16} />
                  </button>
                ) : null}
              </div>

              {unidadDropdownOpen ? (
                <div className="absolute z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white shadow-xl">
                  {unidadesFiltradas.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-slate-500">
                      No se encontraron coincidencias.
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto py-2">
                      {unidadesFiltradas.map((unidad) => (
                        <button
                          key={unidad.id}
                          type="button"
                          onClick={() => selectUnidad(unidad)}
                          className="block w-full px-4 py-3 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                        >
                          {unidad.nombre}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Buscar
              </label>

              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por título, lema o descripción..."
                  className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 text-sm text-slate-500">
            Mostrando <strong>{practicas.length}</strong> de{" "}
            <strong>{meta.total}</strong> prácticas
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-slate-700">
                <tr>
                  <th className="px-4 py-4 text-left font-medium">Título</th>
                  <th className="px-4 py-4 text-left font-medium">
                    Unidad organizacional responsable
                  </th>
                  <th className="px-4 py-4 text-left font-medium">Inscripción</th>
                  <th className="px-4 py-4 text-left font-medium">
                    Estado del flujo
                  </th>
                  <th className="px-4 py-4 text-left font-medium">Acciones</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      Cargando buenas prácticas...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-red-600"
                    >
                      {error}
                    </td>
                  </tr>
                ) : practicas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      No se encontraron buenas prácticas con los filtros actuales.
                    </td>
                  </tr>
                ) : (
                  practicas.map((practica) => (
                    <tr
                      key={practica.id}
                      className="border-t border-slate-200 align-top"
                    >
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-900">
                          {practica.titulo}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Creado el {formatFecha(practica.fecha)}
                        </p>
                      </td>

                      <td className="px-4 py-4 text-slate-800">
                        {practica.unidad_responsable}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {practica.inscripciones.map((chip) => (
                            <span
                              key={`${practica.id}-${chip.id}`}
                              className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700"
                            >
                              {chip.label}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        {renderEstadoBadge(practica.estatus)}
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <ActionButton
                            title="Ver"
                            icon={<Eye size={16} />}
                            tone="slate"
                          />
                          <ActionButton
                            title="Editar"
                            icon={<Pencil size={16} />}
                            tone="blue"
                            onClick={() =>
                              navigate(`/app/ficha/${practica.id}/datos-generales`)
                            }
                          />
                          <ActionButton
                            title="Eliminar"
                            icon={<Trash2 size={16} />}
                            tone="red"
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
              Página <strong>{meta.page}</strong> de{" "}
              <strong>{meta.totalPages}</strong>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Anterior
              </button>

              {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPage(item)}
                    className={[
                      "h-10 min-w-10 rounded-xl px-3 text-sm font-medium transition",
                      item === page
                        ? "bg-slate-900 text-white"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                    ].join(" ")}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                type="button"
                disabled={page === meta.totalPages}
                onClick={() =>
                  setPage((prev) => Math.min(meta.totalPages, prev + 1))
                }
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function CheckboxGroup({ title, items, selected, onToggle }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-800">{title}</p>

      <div className="space-y-2">
        {items.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-3 rounded-xl px-2 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            <input
              type="checkbox"
              checked={selected.includes(item.id)}
              onChange={() => onToggle(item.id)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <span>{item.valor}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function ActionButton({ title, icon, tone = "slate", onClick }) {
  const tones = {
    slate:
      "border-slate-300 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-800",
    blue:
      "border-blue-200 bg-white text-blue-600 hover:bg-blue-50 hover:text-blue-700",
    red:
      "border-red-200 bg-white text-red-600 hover:bg-red-50 hover:text-red-700",
  };

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={[
        "inline-flex h-10 w-10 items-center justify-center rounded-xl border transition",
        tones[tone] || tones.slate,
      ].join(" ")}
    >
      {icon}
    </button>
  );
}

function getEstadoTone(nombre) {
  switch (nombre) {
    case "Validación institucional":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "Autoevaluación":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "Evaluación externa":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "Documentación":
      return "border-slate-200 bg-slate-100 text-slate-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function formatGrupoLabel(grupo) {
  switch (grupo) {
    case "FUNCION_SUSTANTIVA":
      return "Función";
    case "CRITERIO_SEAES":
      return "SEAES";
    case "PROGRAMA_SECTORIAL":
      return "PIDE";
    case "EJE_TRANSVERSAL":
      return "Eje";
    default:
      return grupo;
  }
}

function formatFecha(fecha) {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(fecha));
  } catch {
    return fecha;
  }
}

function normalizeText(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}