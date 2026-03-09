import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../utils/httpError.js";

export async function createBuenaPractica(payload) {
  const {
    titulo,
    unidad_organizacional_id,
    descripcion_breve,
    tipo_registro,
    subtitulo_lema,
    periodo_implementacion,
    creado_por_id,
  } = payload;

  // Validaciones básicas
  if (!titulo || !titulo.trim()) {
    throw HttpError(400, "El campo 'titulo' es obligatorio.");
  }

  if (!unidad_organizacional_id) {
    throw HttpError(400, "El campo 'unidad_organizacional_id' es obligatorio.");
  }

  if (!descripcion_breve || !descripcion_breve.trim()) {
    throw HttpError(400, "El campo 'descripcion_breve' es obligatorio.");
  }

  if (!tipo_registro) {
    throw HttpError(400, "El campo 'tipo_registro' es obligatorio.");
  }

  if (!["NUEVA", "ADOPTADA", "ADAPTADA"].includes(tipo_registro)) {
    throw HttpError(
      400,
      "El campo 'tipo_registro' debe ser NUEVA, ADOPTADA o ADAPTADA."
    );
  }

  if (!periodo_implementacion || !periodo_implementacion.trim()) {
    throw HttpError(400, "El campo 'periodo_implementacion' es obligatorio.");
  }

  if (!creado_por_id) {
    throw HttpError(400, "El campo 'creado_por_id' es obligatorio.");
  }

  // Validar unidad organizacional
  const unidad = await prisma.unidad_organizacional.findUnique({
    where: { id: Number(unidad_organizacional_id) },
  });

  if (!unidad) {
    throw HttpError(404, "La unidad organizacional no existe.");
  }

  // Validar usuario creador
  const usuario = await prisma.user.findUnique({
    where: { id: Number(creado_por_id) },
  });

  if (!usuario) {
    throw HttpError(404, "El usuario creador no existe.");
  }

  // Buscar estatus BORRADOR
  const estatusBorrador = await prisma.buena_practica_estatus.findFirst({
    where: { clave: "BORRADOR" },
  });

  if (!estatusBorrador) {
    throw HttpError(
      500,
      "No se encontró el estatus BORRADOR en el catálogo de estatus."
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1. Crear buena_practica
    const buenaPractica = await tx.buena_practica.create({
      data: {
        titulo: titulo.trim(),
        unidad_organizacional_id: Number(unidad_organizacional_id),
        descripcion_breve: descripcion_breve.trim(),
        tipo_registro,
        estatus_id: estatusBorrador.id,
        activo: true,
        bloqueada_edicion: false,
        creado_por_id: Number(creado_por_id),
        actualizado_por_id: Number(creado_por_id),
      },
    });

    // 2. Crear datos generales
    const datosGenerales = await tx.buena_practica_datos_generales.create({
      data: {
        buena_practica_id: buenaPractica.id,
        subtitulo_lema: subtitulo_lema?.trim() || null,
        periodo_implementacion: periodo_implementacion.trim(),
      },
    });

    // 3. Crear historial inicial
    const historial = await tx.buena_practica_historial.create({
      data: {
        buena_practica_id: buenaPractica.id,
        estatus_anterior_id: null,
        estatus_nuevo_id: estatusBorrador.id,
        comentario: "Registro inicial de la buena práctica en estatus borrador.",
        cambiado_por_id: Number(creado_por_id),
      },
    });

    return {
      buena_practica: buenaPractica,
      datos_generales: datosGenerales,
      historial_inicial: historial,
    };
  });

  return result;
}