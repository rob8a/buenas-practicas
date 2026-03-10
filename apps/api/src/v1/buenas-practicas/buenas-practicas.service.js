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

export async function getBuenaPracticaById(id) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const buenaPractica = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      buena_practica_datos_generales: true,
      unidad_organizacional: true,
      buena_practica_estatus: true,
    },
  });

  if (!buenaPractica || !buenaPractica.activo) {
    throw new HttpError(404, "La buena práctica no existe.");
  }

  return buenaPractica;
}

export async function updateDatosGenerales(id, payload) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const {
    titulo,
    unidad_organizacional_id,
    descripcion_breve,
    subtitulo_lema,
    periodo_implementacion,
    actualizado_por_id,
  } = payload;

  if (!titulo || !titulo.trim()) {
    throw new HttpError(400, "El campo 'titulo' es obligatorio.");
  }

  if (!unidad_organizacional_id) {
    throw new HttpError(400, "El campo 'unidad_organizacional_id' es obligatorio.");
  }

  if (!descripcion_breve || !descripcion_breve.trim()) {
    throw new HttpError(400, "El campo 'descripcion_breve' es obligatorio.");
  }

  if (!periodo_implementacion || !periodo_implementacion.trim()) {
    throw new HttpError(400, "El campo 'periodo_implementacion' es obligatorio.");
  }

  if (!actualizado_por_id) {
    throw new HttpError(400, "El campo 'actualizado_por_id' es obligatorio.");
  }

  const buenaPractica = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      buena_practica_estatus: true,
      buena_practica_datos_generales: true,
    },
  });

  if (!buenaPractica || !buenaPractica.activo) {
    throw new HttpError(404, "La buena práctica no existe.");
  }

  if (buenaPractica.bloqueada_edicion) {
    throw new HttpError(409, "La buena práctica está bloqueada para edición.");
  }

  if (!buenaPractica.buena_practica_estatus?.permite_edicion) {
    throw new HttpError(
      409,
      "La buena práctica no puede editarse en su estatus actual."
    );
  }

  const unidad = await prisma.unidad_organizacional.findUnique({
    where: { id: Number(unidad_organizacional_id) },
  });

  if (!unidad) {
    throw new HttpError(404, "La unidad organizacional no existe.");
  }

  const usuario = await prisma.user.findUnique({
    where: { id: Number(actualizado_por_id) },
  });

  if (!usuario) {
    throw new HttpError(404, "El usuario actualizador no existe.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedBuenaPractica = await tx.buena_practica.update({
      where: { id: buenaPracticaId },
      data: {
        titulo: titulo.trim(),
        unidad_organizacional_id: Number(unidad_organizacional_id),
        descripcion_breve: descripcion_breve.trim(),
        actualizado_por_id: Number(actualizado_por_id),
      },
    });

    let updatedDatosGenerales;

    if (buenaPractica.buena_practica_datos_generales) {
      updatedDatosGenerales = await tx.buena_practica_datos_generales.update({
        where: {
          buena_practica_id: buenaPracticaId,
        },
        data: {
          subtitulo_lema: subtitulo_lema?.trim() || null,
          periodo_implementacion: periodo_implementacion.trim(),
        },
      });
    } else {
      updatedDatosGenerales = await tx.buena_practica_datos_generales.create({
        data: {
          buena_practica_id: buenaPracticaId,
          subtitulo_lema: subtitulo_lema?.trim() || null,
          periodo_implementacion: periodo_implementacion.trim(),
        },
      });
    }

    return {
      buena_practica: updatedBuenaPractica,
      datos_generales: updatedDatosGenerales,
    };
  });

  return result;
}