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
      buena_practica_responsable: {
        orderBy: { orden: "asc" },
      },
      buena_practica_alineacion: {
        include: {
          catalogo_alineacion: true,
        },
        orderBy: {
          catalogo_alineacion: {
            orden: "asc",
          },
        },
      },
      buena_practica_contexto_proposito: true,
      buena_practica_unidad_participante: {
        include: {
          unidad_organizacional: true,
        },
        orderBy: {
          unidad_organizacional: {
            nombre: "asc",
          },
        },
      },
      buena_practica_linea_tiempo: {
        orderBy: [
          { fecha: "asc" },
          { orden: "asc" },
        ],
      },
      buena_practica_fundamentacion: true,
      buena_practica_modelo_educativo_elemento: {
        include: {
          catalogo_modelo_educativo_elemento: true,
        },
        orderBy: {
          catalogo_modelo_educativo_elemento: {
            orden: "asc",
          },
        },
      },
      buena_practica_metodologia: true,
      buena_practica_fase: {
        include: {
          buena_practica_fase_evidencia: true,
        },
        orderBy: {
          numero_fase: "asc",
        },
      },
      buena_practica_foda: true,
      buena_practica_actor_involucrado: {
        orderBy: {
          orden: "asc",
        },
      },
      buena_practica_participacion_colaboracion: true,
      buena_practica_evaluacion_indicadores: true,
      buena_practica_indicador: {
        orderBy: {
          orden: "asc",
        },
      },
      buena_practica_testimonio: {
        orderBy: {
          orden: "asc",
        },
      },
      buena_practica_impacto_sostenibilidad: true,
      buena_practica_conclusion: true,
      buena_practica_plan_mexico_sector: {
        include: {
          catalogo_plan_mexico_sector: true,
        },
        orderBy: {
          catalogo_plan_mexico_sector: {
            orden: "asc",
          },
        },
      },
      buena_practica_ods: {
        include: {
          catalogo_ods: true,
        },
        orderBy: {
          catalogo_ods: {
            numero: "asc",
          },
        },
      },
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
        responsables = [],
        alineaciones = [],
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

  if (!Array.isArray(responsables) || responsables.length === 0) {
    throw new HttpError(
        400,
        "Debe capturarse al menos una persona responsable."
    );
    }

    if (!Array.isArray(alineaciones)) {
        throw new HttpError(400, "El campo 'alineaciones' debe ser un arreglo.");
    }

    if (alineaciones.length > 0) {
    const totalCatalogos = await prisma.catalogo_alineacion.count({
        where: {
        id: { in: alineaciones.map((id) => Number(id)) },
        activo: true,
        },
    });

    if (totalCatalogos !== alineaciones.length) {
        throw new HttpError(
        400,
        "Una o más alineaciones seleccionadas no son válidas."
        );
    }
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

    // Reemplazar responsables
    await tx.buena_practica_responsable.deleteMany({
        where: { buena_practica_id: buenaPracticaId },
    });

    if (responsables.length > 0) {
        await tx.buena_practica_responsable.createMany({
        data: responsables.map((item, index) => ({
            buena_practica_id: buenaPracticaId,
            user_id: null,
            nombre: item.nombre?.trim() || "",
            cargo: item.cargo?.trim() || null,
            correo: item.correo?.trim() || null,
            telefono: item.telefono?.trim() || null,
            orden: index + 1,
        })),
        });
    }

    // Reemplazar alineaciones
    await tx.buena_practica_alineacion.deleteMany({
        where: { buena_practica_id: buenaPracticaId },
    });

    if (alineaciones.length > 0) {
        await tx.buena_practica_alineacion.createMany({
        data: alineaciones.map((catalogoId) => ({
            buena_practica_id: buenaPracticaId,
            catalogo_alineacion_id: Number(catalogoId),
        })),
        });
    }

    const responsablesActualizados = await tx.buena_practica_responsable.findMany({
        where: { buena_practica_id: buenaPracticaId },
        orderBy: { orden: "asc" },
    });

    const alineacionesActualizadas = await tx.buena_practica_alineacion.findMany({
        where: { buena_practica_id: buenaPracticaId },
        include: {
        catalogo_alineacion: true,
        },
    });

    return {
        buena_practica: updatedBuenaPractica,
        datos_generales: updatedDatosGenerales,
        responsables: responsablesActualizados,
        alineaciones: alineacionesActualizadas,
    };
    });

  return result;
}

export async function updateContextoProposito(id, payload) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const {
    entorno,
    necesidad_problematica,
    vinculacion_metas,
    estado_practica,
    proposito_general,
    objetivo_central,
    poblacion_beneficiaria,
    condiciones_origen,
    unidades_participantes = [],
    linea_tiempo = [],
  } = payload;

  if (!entorno || !entorno.trim()) {
    throw new HttpError(
      400,
      "El campo 'entorno' es obligatorio."
    );
  }

  if (!necesidad_problematica || !necesidad_problematica.trim()) {
    throw new HttpError(
      400,
      "El campo 'necesidad_problematica' es obligatorio."
    );
  }

  if (!Array.isArray(unidades_participantes) || unidades_participantes.length === 0) {
    throw new HttpError(
      400,
      "Debe seleccionar al menos una unidad participante."
    );
  }

  if (!vinculacion_metas || !vinculacion_metas.trim()) {
    throw new HttpError(
      400,
      "El campo 'vinculacion_metas' es obligatorio."
    );
  }

  if (!estado_practica) {
    throw new HttpError(
      400,
      "El campo 'estado_practica' es obligatorio."
    );
  }

  if (!["VIGENTE", "CONCLUIDA", "EN_MEJORA"].includes(estado_practica)) {
    throw new HttpError(
      400,
      "El campo 'estado_practica' debe ser VIGENTE, CONCLUIDA o EN_MEJORA."
    );
  }

  if (!proposito_general || !proposito_general.trim()) {
    throw new HttpError(
      400,
      "El campo 'proposito_general' es obligatorio."
    );
  }

  if (!objetivo_central || !objetivo_central.trim()) {
    throw new HttpError(
      400,
      "El campo 'objetivo_central' es obligatorio."
    );
  }

  if (!poblacion_beneficiaria || !poblacion_beneficiaria.trim()) {
    throw new HttpError(
      400,
      "El campo 'poblacion_beneficiaria' es obligatorio."
    );
  }

  if (!condiciones_origen || !condiciones_origen.trim()) {
    throw new HttpError(
      400,
      "El campo 'condiciones_origen' es obligatorio."
    );
  }

  if (!Array.isArray(linea_tiempo)) {
    throw new HttpError(
      400,
      "El campo 'linea_tiempo' debe ser un arreglo."
    );
  }

  const buenaPractica = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      buena_practica_estatus: true,
      buena_practica_contexto_proposito: true,
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

  const idsUnidades = unidades_participantes.map((id) => Number(id));
  const totalUnidades = await prisma.unidad_organizacional.count({
    where: {
      id: { in: idsUnidades },
      activo: true,
    },
  });

  if (totalUnidades !== idsUnidades.length) {
    throw new HttpError(
      400,
      "Una o más unidades participantes no son válidas."
    );
  }

  for (const item of linea_tiempo) {
    if (!item.fecha || !item.nombre || !String(item.nombre).trim()) {
      throw new HttpError(
        400,
        "Cada antecedente debe incluir al menos fecha y nombre."
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    let contextoProposito;

    if (buenaPractica.buena_practica_contexto_proposito) {
      contextoProposito = await tx.buena_practica_contexto_proposito.update({
        where: {
          buena_practica_id: buenaPracticaId,
        },
        data: {
          entorno: entorno.trim(),
          necesidad_problematica: necesidad_problematica.trim(),
          vinculacion_metas: vinculacion_metas.trim(),
          estado_practica,
          proposito_general: proposito_general.trim(),
          objetivo_central: objetivo_central.trim(),
          poblacion_beneficiaria: poblacion_beneficiaria.trim(),
          condiciones_origen: condiciones_origen.trim(),
        },
      });
    } else {
      contextoProposito = await tx.buena_practica_contexto_proposito.create({
        data: {
          buena_practica_id: buenaPracticaId,
          entorno: entorno.trim(),
          necesidad_problematica: necesidad_problematica.trim(),
          vinculacion_metas: vinculacion_metas.trim(),
          estado_practica,
          proposito_general: proposito_general.trim(),
          objetivo_central: objetivo_central.trim(),
          poblacion_beneficiaria: poblacion_beneficiaria.trim(),
          condiciones_origen: condiciones_origen.trim(),
        },
      });
    }

    await tx.buena_practica_unidad_participante.deleteMany({
      where: { buena_practica_id: buenaPracticaId },
    });

    if (idsUnidades.length > 0) {
      await tx.buena_practica_unidad_participante.createMany({
        data: idsUnidades.map((unidadId) => ({
          buena_practica_id: buenaPracticaId,
          unidad_organizacional_id: unidadId,
        })),
      });
    }

    await tx.buena_practica_linea_tiempo.deleteMany({
      where: { buena_practica_id: buenaPracticaId },
    });

    if (linea_tiempo.length > 0) {
      await tx.buena_practica_linea_tiempo.createMany({
        data: linea_tiempo.map((item, index) => ({
          buena_practica_id: buenaPracticaId,
          fecha: new Date(item.fecha),
          nombre: String(item.nombre).trim(),
          descripcion: item.descripcion?.trim() || null,
          orden: index + 1,
        })),
      });
    }

    const unidadesActualizadas =
      await tx.buena_practica_unidad_participante.findMany({
        where: { buena_practica_id: buenaPracticaId },
        include: {
          unidad_organizacional: true,
        },
        orderBy: {
          unidad_organizacional: {
            nombre: "asc",
          },
        },
      });

    const lineaTiempoActualizada =
      await tx.buena_practica_linea_tiempo.findMany({
        where: { buena_practica_id: buenaPracticaId },
        orderBy: [
          { fecha: "asc" },
          { orden: "asc" },
        ],
      });

    return {
      contexto_proposito: contextoProposito,
      unidades_participantes: unidadesActualizadas,
      linea_tiempo: lineaTiempoActualizada,
    };
  });

  return result;
}

export async function updateFundamentacion(id, payload) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const {
    vinculacion_modelo_educativo,
    fundamentacion_teorica,
    politica_institucional,
    modelo_educativo_elementos = [],
    plan_mexico_sectores = [],
    ods = [],
  } = payload;

  if (
    !fundamentacion_teorica?.trim() &&
    !politica_institucional?.trim()
  ) {
    throw new HttpError(
      400,
      "Debe capturarse la fundamentación teórica o la política institucional."
    );
  }

  if (!Array.isArray(modelo_educativo_elementos)) {
    throw new HttpError(
      400,
      "El campo 'modelo_educativo_elementos' debe ser un arreglo."
    );
  }

  if (!Array.isArray(plan_mexico_sectores)) {
    throw new HttpError(
      400,
      "El campo 'plan_mexico_sectores' debe ser un arreglo."
    );
  }

  if (!Array.isArray(ods)) {
    throw new HttpError(
      400,
      "El campo 'ods' debe ser un arreglo."
    );
  }

  const buenaPractica = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      buena_practica_estatus: true,
      buena_practica_fundamentacion: true,
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

  const idsModelo = modelo_educativo_elementos.map((item) => Number(item));
  const idsPlanMexico = plan_mexico_sectores.map((item) => Number(item));
  const idsOds = ods.map((item) => Number(item));

  if (idsModelo.length > 0) {
    const totalModelo = await prisma.catalogo_modelo_educativo_elemento.count({
      where: {
        id: { in: idsModelo },
        activo: true,
      },
    });

    if (totalModelo !== idsModelo.length) {
      throw new HttpError(
        400,
        "Uno o más elementos del modelo educativo no son válidos."
      );
    }
  }

  if (idsPlanMexico.length > 0) {
    const totalPlanMexico = await prisma.catalogo_plan_mexico_sector.count({
      where: {
        id: { in: idsPlanMexico },
        activo: true,
      },
    });

    if (totalPlanMexico !== idsPlanMexico.length) {
      throw new HttpError(
        400,
        "Uno o más sectores estratégicos no son válidos."
      );
    }
  }

  if (idsOds.length > 0) {
    const totalOds = await prisma.catalogo_ods.count({
      where: {
        id: { in: idsOds },
        activo: true,
      },
    });

    if (totalOds !== idsOds.length) {
      throw new HttpError(
        400,
        "Uno o más objetivos de desarrollo sostenible no son válidos."
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    let fundamentacion;

    if (buenaPractica.buena_practica_fundamentacion) {
      fundamentacion = await tx.buena_practica_fundamentacion.update({
        where: {
          buena_practica_id: buenaPracticaId,
        },
        data: {
          vinculacion_modelo_educativo:
            vinculacion_modelo_educativo?.trim() || null,
          fundamentacion_teorica: fundamentacion_teorica?.trim() || null,
          politica_institucional: politica_institucional?.trim() || null,
        },
      });
    } else {
      fundamentacion = await tx.buena_practica_fundamentacion.create({
        data: {
          buena_practica_id: buenaPracticaId,
          vinculacion_modelo_educativo:
            vinculacion_modelo_educativo?.trim() || null,
          fundamentacion_teorica: fundamentacion_teorica?.trim() || null,
          politica_institucional: politica_institucional?.trim() || null,
        },
      });
    }

    await tx.buena_practica_modelo_educativo_elemento.deleteMany({
      where: { buena_practica_id: buenaPracticaId },
    });

    if (idsModelo.length > 0) {
      await tx.buena_practica_modelo_educativo_elemento.createMany({
        data: idsModelo.map((catalogoId) => ({
          buena_practica_id: buenaPracticaId,
          catalogo_modelo_educativo_elemento_id: catalogoId,
        })),
      });
    }

    await tx.buena_practica_plan_mexico_sector.deleteMany({
      where: { buena_practica_id: buenaPracticaId },
    });

    if (idsPlanMexico.length > 0) {
      await tx.buena_practica_plan_mexico_sector.createMany({
        data: idsPlanMexico.map((catalogoId) => ({
          buena_practica_id: buenaPracticaId,
          catalogo_plan_mexico_sector_id: catalogoId,
        })),
      });
    }

    await tx.buena_practica_ods.deleteMany({
      where: { buena_practica_id: buenaPracticaId },
    });

    if (idsOds.length > 0) {
      await tx.buena_practica_ods.createMany({
        data: idsOds.map((catalogoId) => ({
          buena_practica_id: buenaPracticaId,
          catalogo_ods_id: catalogoId,
        })),
      });
    }

    const modeloActualizado =
      await tx.buena_practica_modelo_educativo_elemento.findMany({
        where: { buena_practica_id: buenaPracticaId },
        include: {
          catalogo_modelo_educativo_elemento: true,
        },
        orderBy: {
          catalogo_modelo_educativo_elemento: {
            orden: "asc",
          },
        },
      });

    const planMexicoActualizado =
      await tx.buena_practica_plan_mexico_sector.findMany({
        where: { buena_practica_id: buenaPracticaId },
        include: {
          catalogo_plan_mexico_sector: true,
        },
        orderBy: {
          catalogo_plan_mexico_sector: {
            orden: "asc",
          },
        },
      });

    const odsActualizados = await tx.buena_practica_ods.findMany({
      where: { buena_practica_id: buenaPracticaId },
      include: {
        catalogo_ods: true,
      },
      orderBy: {
        catalogo_ods: {
          numero: "asc",
        },
      },
    });

    return {
      fundamentacion,
      modelo_educativo_elementos: modeloActualizado,
      plan_mexico_sectores: planMexicoActualizado,
      ods: odsActualizados,
    };
  });

  return result;
}

export async function updateMetodologia(id, payload) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const { descripcion_general, fases = [] } = payload;

  if (!descripcion_general || !descripcion_general.trim()) {
    throw new HttpError(
      400,
      "El campo 'descripcion_general' es obligatorio."
    );
  }

  if (!Array.isArray(fases) || fases.length !== 5) {
    throw new HttpError(
      400,
      "Debe enviarse la información completa de las 5 fases."
    );
  }

  const buenaPractica = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      buena_practica_estatus: true,
      buena_practica_metodologia: true,
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

  const numerosValidos = [1, 2, 3, 4, 5];

  for (const fase of fases) {
    const numero = Number(fase.numero_fase);

    if (!numerosValidos.includes(numero)) {
      throw new HttpError(
        400,
        "Cada fase debe tener un numero_fase válido entre 1 y 5."
      );
    }

    if (!fase.nombre_fase || !String(fase.nombre_fase).trim()) {
      throw new HttpError(
        400,
        `La fase ${numero} debe incluir nombre_fase.`
      );
    }

    if (!fase.descripcion || !String(fase.descripcion).trim()) {
      throw new HttpError(
        400,
        `La fase ${numero} debe incluir descripción.`
      );
    }

    if (!fase.duracion || !String(fase.duracion).trim()) {
      throw new HttpError(
        400,
        `La fase ${numero} debe incluir duración.`
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    let metodologia;

    if (buenaPractica.buena_practica_metodologia) {
      metodologia = await tx.buena_practica_metodologia.update({
        where: {
          buena_practica_id: buenaPracticaId,
        },
        data: {
          descripcion_general: descripcion_general.trim(),
        },
      });
    } else {
      metodologia = await tx.buena_practica_metodologia.create({
        data: {
          buena_practica_id: buenaPracticaId,
          descripcion_general: descripcion_general.trim(),
        },
      });
    }

    await tx.buena_practica_fase.deleteMany({
      where: { buena_practica_id: buenaPracticaId },
    });

    await tx.buena_practica_fase.createMany({
      data: fases.map((fase) => ({
        buena_practica_id: buenaPracticaId,
        numero_fase: Number(fase.numero_fase),
        nombre_fase: String(fase.nombre_fase).trim(),
        descripcion: String(fase.descripcion).trim(),
        duracion: String(fase.duracion).trim(),
        sin_informacion: Boolean(fase.sin_informacion),
      })),
    });

    const fasesActualizadas = await tx.buena_practica_fase.findMany({
      where: { buena_practica_id: buenaPracticaId },
      include: {
        buena_practica_fase_evidencia: true,
      },
      orderBy: {
        numero_fase: "asc",
      },
    });

    return {
      metodologia,
      fases: fasesActualizadas,
    };
  });

  return result;
}

export async function updateFoda(id, payload) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const {
    fortalezas,
    oportunidades,
    debilidades,
    amenazas,
    estrategias_derivadas,
  } = payload;

  if (!fortalezas || !fortalezas.trim()) {
    throw new HttpError(400, "El campo 'fortalezas' es obligatorio.");
  }

  if (!oportunidades || !oportunidades.trim()) {
    throw new HttpError(400, "El campo 'oportunidades' es obligatorio.");
  }

  if (!debilidades || !debilidades.trim()) {
    throw new HttpError(400, "El campo 'debilidades' es obligatorio.");
  }

  if (!amenazas || !amenazas.trim()) {
    throw new HttpError(400, "El campo 'amenazas' es obligatorio.");
  }

  const buenaPractica = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      buena_practica_estatus: true,
      buena_practica_foda: true,
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

  const result = await prisma.$transaction(async (tx) => {
    let foda;

    if (buenaPractica.buena_practica_foda) {
      foda = await tx.buena_practica_foda.update({
        where: {
          buena_practica_id: buenaPracticaId,
        },
        data: {
          fortalezas: fortalezas.trim(),
          oportunidades: oportunidades.trim(),
          debilidades: debilidades.trim(),
          amenazas: amenazas.trim(),
          estrategias_derivadas: estrategias_derivadas?.trim() || null,
        },
      });
    } else {
      foda = await tx.buena_practica_foda.create({
        data: {
          buena_practica_id: buenaPracticaId,
          fortalezas: fortalezas.trim(),
          oportunidades: oportunidades.trim(),
          debilidades: debilidades.trim(),
          amenazas: amenazas.trim(),
          estrategias_derivadas: estrategias_derivadas?.trim() || null,
        },
      });
    }

    return { foda };
  });

  return result;
}

export async function updateParticipacion(id, payload) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const {
    actores = [],
    descripcion_coordinacion,
    aportes_interdisciplinarios,
  } = payload;

  if (!Array.isArray(actores)) {
    throw new HttpError(400, "El campo 'actores' debe ser un arreglo.");
  }

  if (!descripcion_coordinacion || !descripcion_coordinacion.trim()) {
    throw new HttpError(
      400,
      "El campo 'descripcion_coordinacion' es obligatorio."
    );
  }

  for (const actor of actores) {
    if (!actor.nombre || !String(actor.nombre).trim()) {
      throw new HttpError(
        400,
        "Cada actor debe incluir al menos el nombre."
      );
    }
  }

  const buenaPractica = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      buena_practica_estatus: true,
      buena_practica_participacion_colaboracion: true,
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

  const result = await prisma.$transaction(async (tx) => {
    let participacion;

    if (buenaPractica.buena_practica_participacion_colaboracion) {
      participacion =
        await tx.buena_practica_participacion_colaboracion.update({
          where: {
            buena_practica_id: buenaPracticaId,
          },
          data: {
            descripcion_coordinacion: descripcion_coordinacion.trim(),
            aportes_interdisciplinarios:
              aportes_interdisciplinarios?.trim() || null,
          },
        });
    } else {
      participacion =
        await tx.buena_practica_participacion_colaboracion.create({
          data: {
            buena_practica_id: buenaPracticaId,
            descripcion_coordinacion: descripcion_coordinacion.trim(),
            aportes_interdisciplinarios:
              aportes_interdisciplinarios?.trim() || null,
          },
        });
    }

    await tx.buena_practica_actor_involucrado.deleteMany({
      where: { buena_practica_id: buenaPracticaId },
    });

    if (actores.length > 0) {
      await tx.buena_practica_actor_involucrado.createMany({
        data: actores.map((actor, index) => ({
          buena_practica_id: buenaPracticaId,
          nombre: String(actor.nombre).trim(),
          rol: actor.rol?.trim() || null,
          unidad_organizacional_id: null,
          unidad_organizacional_texto: actor.unidad?.trim() || null,
          orden: index + 1,
        })),
      });
    }

    const actoresActualizados =
      await tx.buena_practica_actor_involucrado.findMany({
        where: { buena_practica_id: buenaPracticaId },
        orderBy: { orden: "asc" },
      });

    return {
      participacion,
      actores: actoresActualizados,
    };
  });

  return result;
}

export async function updateEvaluacion(id, payload) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const {
    instrumentos_evaluacion,
    logros_clave,
    hallazgos_identificados,
    indicadores = [],
    testimonios = [],
  } = payload;

  if (!Array.isArray(indicadores)) {
    throw new HttpError(400, "El campo 'indicadores' debe ser un arreglo.");
  }

  if (!Array.isArray(testimonios)) {
    throw new HttpError(400, "El campo 'testimonios' debe ser un arreglo.");
  }

  if (!logros_clave || !logros_clave.trim()) {
    throw new HttpError(400, "El campo 'logros_clave' es obligatorio.");
  }

  for (const indicador of indicadores) {
    if (!indicador.nombre || !String(indicador.nombre).trim()) {
      throw new HttpError(
        400,
        "Cada indicador debe incluir al menos el nombre."
      );
    }
  }

  for (const testimonio of testimonios) {
    if (!testimonio.testimonio || !String(testimonio.testimonio).trim()) {
      throw new HttpError(
        400,
        "Cada testimonio debe incluir contenido."
      );
    }
  }

  const buenaPractica = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      buena_practica_estatus: true,
      buena_practica_evaluacion_indicadores: true,
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

  const result = await prisma.$transaction(async (tx) => {
    let evaluacion;

    if (buenaPractica.buena_practica_evaluacion_indicadores) {
      evaluacion = await tx.buena_practica_evaluacion_indicadores.update({
        where: {
          buena_practica_id: buenaPracticaId,
        },
        data: {
          instrumentos_evaluacion: instrumentos_evaluacion?.trim() || null,
          logros_clave: logros_clave.trim(),
          hallazgos_identificados: hallazgos_identificados?.trim() || null,
        },
      });
    } else {
      evaluacion = await tx.buena_practica_evaluacion_indicadores.create({
        data: {
          buena_practica_id: buenaPracticaId,
          instrumentos_evaluacion: instrumentos_evaluacion?.trim() || null,
          logros_clave: logros_clave.trim(),
          hallazgos_identificados: hallazgos_identificados?.trim() || null,
        },
      });
    }

    await tx.buena_practica_indicador.deleteMany({
      where: { buena_practica_id: buenaPracticaId },
    });

    if (indicadores.length > 0) {
      await tx.buena_practica_indicador.createMany({
        data: indicadores.map((item, index) => ({
          buena_practica_id: buenaPracticaId,
          nombre: String(item.nombre).trim(),
          indicador: item.indicador?.trim() || null,
          unidad_medida: item.unidad_medida?.trim() || null,
          meta_esperada: item.meta_esperada?.trim() || null,
          descripcion_breve: item.descripcion_breve?.trim() || null,
          periodo: item.periodo?.trim() || null,
          orden: index + 1,
        })),
      });
    }

    await tx.buena_practica_testimonio.deleteMany({
      where: { buena_practica_id: buenaPracticaId },
    });

    if (testimonios.length > 0) {
      await tx.buena_practica_testimonio.createMany({
        data: testimonios.map((item, index) => ({
          buena_practica_id: buenaPracticaId,
          testimonio: String(item.testimonio).trim(),
          cargo: item.cargo?.trim() || null,
          orden: index + 1,
        })),
      });
    }

    const indicadoresActualizados = await tx.buena_practica_indicador.findMany({
      where: { buena_practica_id: buenaPracticaId },
      orderBy: { orden: "asc" },
    });

    const testimoniosActualizados = await tx.buena_practica_testimonio.findMany({
      where: { buena_practica_id: buenaPracticaId },
      orderBy: { orden: "asc" },
    });

    return {
      evaluacion,
      indicadores: indicadoresActualizados,
      testimonios: testimoniosActualizados,
    };
  });

  return result;
}

export async function updateImpacto(id, payload) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const {
    sistematizacion_hallazgos,
    instancias_recomendaciones,
    resultados_inmediatos,
    efectos_mediano_plazo,
    vinculacion_pide_seaes_ods,
    condiciones_permanencia,
    aspectos_replicabilidad,
    motor_cambio_mejora_continua,
    acciones_estrategias_derivadas,
  } = payload;

  if (!sistematizacion_hallazgos || !sistematizacion_hallazgos.trim()) {
    throw new HttpError(
      400,
      "El campo 'sistematizacion_hallazgos' es obligatorio."
    );
  }

  if (!instancias_recomendaciones || !instancias_recomendaciones.trim()) {
    throw new HttpError(
      400,
      "El campo 'instancias_recomendaciones' es obligatorio."
    );
  }

  if (!resultados_inmediatos || !resultados_inmediatos.trim()) {
    throw new HttpError(
      400,
      "El campo 'resultados_inmediatos' es obligatorio."
    );
  }

  if (!efectos_mediano_plazo || !efectos_mediano_plazo.trim()) {
    throw new HttpError(
      400,
      "El campo 'efectos_mediano_plazo' es obligatorio."
    );
  }

  if (!vinculacion_pide_seaes_ods || !vinculacion_pide_seaes_ods.trim()) {
    throw new HttpError(
      400,
      "El campo 'vinculacion_pide_seaes_ods' es obligatorio."
    );
  }

  if (!condiciones_permanencia || !condiciones_permanencia.trim()) {
    throw new HttpError(
      400,
      "El campo 'condiciones_permanencia' es obligatorio."
    );
  }

  if (!aspectos_replicabilidad || !aspectos_replicabilidad.trim()) {
    throw new HttpError(
      400,
      "El campo 'aspectos_replicabilidad' es obligatorio."
    );
  }

  if (
    !motor_cambio_mejora_continua ||
    !motor_cambio_mejora_continua.trim()
  ) {
    throw new HttpError(
      400,
      "El campo 'motor_cambio_mejora_continua' es obligatorio."
    );
  }

  if (
    !acciones_estrategias_derivadas ||
    !acciones_estrategias_derivadas.trim()
  ) {
    throw new HttpError(
      400,
      "El campo 'acciones_estrategias_derivadas' es obligatorio."
    );
  }

  const buenaPractica = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      buena_practica_estatus: true,
      buena_practica_impacto_sostenibilidad: true,
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

  const result = await prisma.$transaction(async (tx) => {
    let impacto;

    if (buenaPractica.buena_practica_impacto_sostenibilidad) {
      impacto = await tx.buena_practica_impacto_sostenibilidad.update({
        where: {
          buena_practica_id: buenaPracticaId,
        },
        data: {
          sistematizacion_hallazgos: sistematizacion_hallazgos.trim(),
          instancias_recomendaciones: instancias_recomendaciones.trim(),
          resultados_inmediatos: resultados_inmediatos.trim(),
          efectos_mediano_plazo: efectos_mediano_plazo.trim(),
          vinculacion_pide_seaes_ods: vinculacion_pide_seaes_ods.trim(),
          condiciones_permanencia: condiciones_permanencia.trim(),
          aspectos_replicabilidad: aspectos_replicabilidad.trim(),
          motor_cambio_mejora_continua: motor_cambio_mejora_continua.trim(),
          acciones_estrategias_derivadas:
            acciones_estrategias_derivadas.trim(),
        },
      });
    } else {
      impacto = await tx.buena_practica_impacto_sostenibilidad.create({
        data: {
          buena_practica_id: buenaPracticaId,
          sistematizacion_hallazgos: sistematizacion_hallazgos.trim(),
          instancias_recomendaciones: instancias_recomendaciones.trim(),
          resultados_inmediatos: resultados_inmediatos.trim(),
          efectos_mediano_plazo: efectos_mediano_plazo.trim(),
          vinculacion_pide_seaes_ods: vinculacion_pide_seaes_ods.trim(),
          condiciones_permanencia: condiciones_permanencia.trim(),
          aspectos_replicabilidad: aspectos_replicabilidad.trim(),
          motor_cambio_mejora_continua: motor_cambio_mejora_continua.trim(),
          acciones_estrategias_derivadas:
            acciones_estrategias_derivadas.trim(),
        },
      });
    }

    return { impacto };
  });

  return result;
}

export async function updateConclusiones(id, payload) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const {
    principales_aprendizajes,
    recomendaciones_propuestas,
  } = payload;

  if (!principales_aprendizajes || !principales_aprendizajes.trim()) {
    throw new HttpError(
      400,
      "El campo 'principales_aprendizajes' es obligatorio."
    );
  }

  if (!recomendaciones_propuestas || !recomendaciones_propuestas.trim()) {
    throw new HttpError(
      400,
      "El campo 'recomendaciones_propuestas' es obligatorio."
    );
  }

  const buenaPractica = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      buena_practica_estatus: true,
      buena_practica_conclusion: true, // cambia a plural si así está en tu Prisma
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

  const result = await prisma.$transaction(async (tx) => {
    let conclusiones;

    if (buenaPractica.buena_practica_conclusion) {
      conclusiones = await tx.buena_practica_conclusion.update({
        where: {
          buena_practica_id: buenaPracticaId,
        },
        data: {
          principales_aprendizajes: principales_aprendizajes.trim(),
          recomendaciones_propuestas: recomendaciones_propuestas.trim(),
        },
      });
    } else {
      conclusiones = await tx.buena_practica_conclusion.create({
        data: {
          buena_practica_id: buenaPracticaId,
          principales_aprendizajes: principales_aprendizajes.trim(),
          recomendaciones_propuestas: recomendaciones_propuestas.trim(),
        },
      });
    }

    return { conclusiones };
  });

  return result;
}

export async function getBuenasPracticas(query) {
  const {
    search = "",
    unidad_id,
    alineaciones = "",
    page = 1,
    limit = 5,
  } = query;

  const pageNumber = Math.max(Number(page) || 1, 1);
  const pageSize = Math.max(Number(limit) || 5, 1);

  const where = {
    activo: true,
  };

  if (search.trim()) {
    where.OR = [
      {
        titulo: {
          contains: search.trim(),
        },
      },
      {
        descripcion_breve: {
          contains: search.trim(),
        },
      },
      {
        buena_practica_datos_generales: {
          subtitulo_lema: {
            contains: search.trim(),
          },
        },
      },
    ];
  }

  if (unidad_id) {
    where.unidad_organizacional_id = Number(unidad_id);
  }

  const alineacionIds = alineaciones
    ? String(alineaciones)
        .split(",")
        .map((item) => Number(item))
        .filter((item) => !Number.isNaN(item))
    : [];

  if (alineacionIds.length > 0) {
    where.buena_practica_alineacion = {
      some: {
        catalogo_alineacion_id: {
          in: alineacionIds,
        },
      },
    };
  }

  const total = await prisma.buena_practica.count({ where });

  const items = await prisma.buena_practica.findMany({
    where,
    skip: (pageNumber - 1) * pageSize,
    take: pageSize,
    orderBy: {
      createdAt: "desc",
    },
    include: {
      unidad_organizacional: true,
      buena_practica_estatus: true,
      buena_practica_datos_generales: true,
      buena_practica_alineacion: {
        include: {
          catalogo_alineacion: true,
        },
        orderBy: {
          catalogo_alineacion: {
            orden: "asc",
          },
        },
      },
    },
  });

  const data = items.map((item) => ({
    id: item.id,
    titulo: item.titulo,
    lema: item.buena_practica_datos_generales?.subtitulo_lema || "",
    descripcion_breve: item.descripcion_breve || "",
    fecha: item.createdAt,
    unidad_responsable: item.unidad_organizacional?.nombre || "Sin especificar",
    unidad_id: item.unidad_organizacional_id,
    estatus: item.buena_practica_estatus
      ? {
          id: item.buena_practica_estatus.id,
          nombre: item.buena_practica_estatus.nombre,
        }
      : null,
    inscripciones: item.buena_practica_alineacion.map((rel) => ({
      id: rel.catalogo_alineacion?.id,
      grupo: rel.catalogo_alineacion?.grupo,
      nombre: rel.catalogo_alineacion?.valor,
      label: `${formatGrupoListado(rel.catalogo_alineacion?.grupo)}: ${
        rel.catalogo_alineacion?.valor || ""
      }`,
    })),
  }));

  return {
    data,
    meta: {
      total,
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.max(Math.ceil(total / pageSize), 1),
    },
  };
}

function formatGrupoListado(grupo) {
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
      return grupo || "Grupo";
  }
}

export async function getValidacionEnvio(id) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const bp = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      unidad_organizacional: true,
      buena_practica_datos_generales: true,
      buena_practica_responsable: true,
      buena_practica_alineacion: true,

      buena_practica_contexto_proposito: true,
      buena_practica_unidad_participante: true,
      buena_practica_linea_tiempo: true,

      buena_practica_fundamentacion: true,

      buena_practica_metodologia: true,
      buena_practica_fase: true,

      buena_practica_foda: true,

      buena_practica_participacion_colaboracion: true,

      buena_practica_evaluacion_indicadores: true,
      buena_practica_indicador: true,

      buena_practica_impacto_sostenibilidad: true,

      buena_practica_conclusion: true,
    },
  });

  if (!bp || !bp.activo) {
    throw new HttpError(404, "La buena práctica no existe.");
  }

  const secciones = [];

  // 1. Datos generales
  {
    const pendientes = [];

    if (!bp.titulo?.trim()) {
      pendientes.push("Falta capturar el título de la buena práctica.");
    }

    if (!bp.descripcion_breve?.trim()) {
      pendientes.push("Falta capturar la descripción breve.");
    }

    if (!bp.unidad_organizacional_id) {
      pendientes.push("Falta seleccionar la unidad organizacional.");
    }

    if (!bp.buena_practica_responsable?.length) {
      pendientes.push("Falta capturar al menos una persona responsable.");
    }

    if (!bp.buena_practica_alineacion?.length) {
      pendientes.push(
        "Falta capturar al menos una categoría de inscripción de la buena práctica."
      );
    }

    if (!bp.buena_practica_datos_generales?.periodo_implementacion?.trim()) {
      pendientes.push("Falta capturar el periodo de implementación.");
    }

    secciones.push({
      clave: "datos-generales",
      nombre: "Datos generales",
      completa: pendientes.length === 0,
      pendientes,
    });
  }

  // 2. Contexto y propósito
  {
    const pendientes = [];
    const cp = bp.buena_practica_contexto_proposito;

    if (!cp?.entorno?.trim()) {
      pendientes.push("Falta describir el entorno que dio lugar a la práctica.");
    }

    if (!cp?.necesidad_problematica?.trim()) {
      pendientes.push("Falta capturar la necesidad o problemática.");
    }

    if (!bp.buena_practica_unidad_participante?.length) {
      pendientes.push("Falta capturar al menos una unidad participante.");
    }

    if (!cp?.vinculacion_metas?.trim()) {
      pendientes.push("Falta capturar la vinculación con metas del PIDE, POA, SEAES u ODS.");
    }

    if (!cp?.estado_practica?.trim()) {
      pendientes.push("Falta capturar el estado actual de la práctica.");
    }

    if (!cp?.proposito_general?.trim()) {
      pendientes.push("Falta capturar el propósito general de la buena práctica.");
    }

    if (!cp?.objetivo_central?.trim()) {
      pendientes.push("Falta capturar el objetivo central.");
    }

    if (!cp?.poblacion_beneficiaria?.trim()) {
      pendientes.push("Falta capturar la población beneficiaria.");
    }

    if (!cp?.condiciones_origen?.trim()) {
      pendientes.push(
        "Falta describir las condiciones que motivaron el desarrollo de la acción."
      );
    }

    if (!bp.buena_practica_linea_tiempo?.length) {
      pendientes.push("Falta capturar al menos un antecedente en la línea del tiempo.");
    }

    secciones.push({
      clave: "contexto",
      nombre: "Contexto y propósito",
      completa: pendientes.length === 0,
      pendientes,
    });
  }

  // 3. Fundamentación
  {
    const pendientes = [];
    const f = bp.buena_practica_fundamentacion;

    const tieneTeorica = Boolean(f?.fundamentacion_teorica?.trim());
    const tienePolitica = Boolean(f?.politica_institucional?.trim());

    if (!tieneTeorica && !tienePolitica) {
      pendientes.push(
        "Falta capturar la fundamentación teórica o la política institucional."
      );
    }

    secciones.push({
      clave: "fundamentacion",
      nombre: "Fundamentación",
      completa: pendientes.length === 0,
      pendientes,
    });
  }

  // 4. Metodología y desarrollo
  {
    const pendientes = [];
    const m = bp.buena_practica_metodologia;
    const fases = bp.buena_practica_fase || [];

    if (!m?.descripcion_general?.trim()) {
      pendientes.push("Falta capturar la descripción general de la metodología.");
    }

    if (fases.length !== 5) {
      pendientes.push("Faltan fases del proceso por capturar.");
    } else {
      for (const numero of [1, 2, 3, 4, 5]) {
        const fase = fases.find((item) => Number(item.numero_fase) === numero);

        if (!fase) {
          pendientes.push(`Falta capturar la fase ${numero}.`);
          continue;
        }

        const descripcionOk = Boolean(fase.descripcion?.trim());
        const duracionOk = Boolean(fase.duracion?.trim());
        const sinInfo = Boolean(fase.sin_informacion);

        if (!(sinInfo || (descripcionOk && duracionOk))) {
          pendientes.push(
            `La fase ${numero} debe tener descripción y duración, o marcarse como "sin información aún".`
          );
        }
      }
    }

    secciones.push({
      clave: "metodologia",
      nombre: "Metodología y desarrollo",
      completa: pendientes.length === 0,
      pendientes,
    });
  }

  // 5. FODA
  {
    const pendientes = [];
    const foda = bp.buena_practica_foda;

    if (!foda?.fortalezas?.trim()) {
      pendientes.push("Falta capturar fortalezas.");
    }

    if (!foda?.oportunidades?.trim()) {
      pendientes.push("Falta capturar oportunidades.");
    }

    if (!foda?.debilidades?.trim()) {
      pendientes.push("Falta capturar debilidades.");
    }

    if (!foda?.amenazas?.trim()) {
      pendientes.push("Falta capturar amenazas.");
    }

    secciones.push({
      clave: "foda",
      nombre: "Análisis FODA",
      completa: pendientes.length === 0,
      pendientes,
    });
  }

  // 6. Participación y colaboración
  {
    const pendientes = [];
    const p = bp.buena_practica_participacion_colaboracion;

    if (!p?.descripcion_coordinacion?.trim()) {
      pendientes.push(
        "Falta capturar la descripción de la coordinación del trabajo colaborativo."
      );
    }

    secciones.push({
      clave: "participacion",
      nombre: "Participación y colaboración",
      completa: pendientes.length === 0,
      pendientes,
    });
  }

  // 7. Evaluación, indicadores y evidencias
  {
    const pendientes = [];
    const e = bp.buena_practica_evaluacion_indicadores;

    if (!bp.buena_practica_indicador?.length) {
      pendientes.push("Falta capturar al menos un indicador.");
    }

    if (!e?.logros_clave?.trim()) {
      pendientes.push("Falta capturar los logros clave.");
    }

    secciones.push({
      clave: "evaluacion",
      nombre: "Evaluación, indicadores y evidencias",
      completa: pendientes.length === 0,
      pendientes,
    });
  }

  // 8. Impacto y sostenibilidad
  {
    const pendientes = [];
    const i = bp.buena_practica_impacto_sostenibilidad;

    if (!i?.sistematizacion_hallazgos?.trim()) {
      pendientes.push("Falta capturar cómo se sistematizan los hallazgos.");
    }

    if (!i?.instancias_recomendaciones?.trim()) {
      pendientes.push("Falta capturar qué instancias reciben las recomendaciones.");
    }

    if (!i?.resultados_inmediatos?.trim()) {
      pendientes.push("Falta capturar los resultados inmediatos observados.");
    }

    if (!i?.efectos_mediano_plazo?.trim()) {
      pendientes.push("Falta capturar los efectos a mediano plazo.");
    }

    if (!i?.vinculacion_pide_seaes_ods?.trim()) {
      pendientes.push("Falta capturar la vinculación con PIDE, SEAES u ODS.");
    }

    if (!i?.condiciones_permanencia?.trim()) {
      pendientes.push("Falta capturar las condiciones que aseguran su permanencia.");
    }

    if (!i?.aspectos_replicabilidad?.trim()) {
      pendientes.push(
        "Falta capturar los aspectos indispensables para implementarla en otros contextos."
      );
    }

    if (!i?.motor_cambio_mejora_continua?.trim()) {
      pendientes.push(
        "Falta capturar de qué manera ha servido como motor de cambio."
      );
    }

    if (!i?.acciones_estrategias_derivadas?.trim()) {
      pendientes.push("Falta capturar las acciones o estrategias derivadas.");
    }

    secciones.push({
      clave: "impacto",
      nombre: "Impacto y sostenibilidad",
      completa: pendientes.length === 0,
      pendientes,
    });
  }

  // 9. Conclusiones
  {
    const pendientes = [];
    const c = bp.buena_practica_conclusion;

    if (!c?.principales_aprendizajes?.trim()) {
      pendientes.push("Falta capturar los principales aprendizajes.");
    }

    if (!c?.recomendaciones_propuestas?.trim()) {
      pendientes.push("Falta capturar las recomendaciones y propuestas.");
    }

    secciones.push({
      clave: "conclusiones",
      nombre: "Conclusiones",
      completa: pendientes.length === 0,
      pendientes,
    });
  }

  const completadas = secciones.filter((item) => item.completa).length;
  const total = secciones.length;
  const puede_enviar = secciones.every((item) => item.completa);

  return {
    puede_enviar,
    resumen: {
      completadas,
      total,
    },
    secciones,
  };
}

export async function sendToAutoevaluacion(id, payload = {}) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const { cambiado_por_id } = payload;

  if (!cambiado_por_id || Number.isNaN(Number(cambiado_por_id))) {
    throw new HttpError(
      400,
      "Es necesario indicar el usuario que realiza el envío."
    );
  }

  const validacion = await getValidacionEnvio(buenaPracticaId);

  if (!validacion.puede_enviar) {
    throw new HttpError(
      409,
      "La ficha no está completa para enviarse a autoevaluación.",
      {
        puede_enviar: false,
        resumen: validacion.resumen,
        secciones: validacion.secciones,
      }
    );
  }

  const AUTOEVALUACION_ESTATUS_ID = 2; // <-- cámbialo si el id real es otro

  const bp = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      buena_practica_estatus: true,
    },
  });

  if (!bp || !bp.activo) {
    throw new HttpError(404, "La buena práctica no existe.");
  }

  if (bp.bloqueada_edicion) {
    throw new HttpError(409, "La buena práctica está bloqueada para edición.");
  }

  if (Number(bp.estatus_id) === AUTOEVALUACION_ESTATUS_ID) {
    throw new HttpError(
      409,
      "La buena práctica ya se encuentra en autoevaluación."
    );
  }

  const nuevoEstatus = await prisma.buena_practica_estatus.findUnique({
    where: { id: AUTOEVALUACION_ESTATUS_ID },
  });

  if (!nuevoEstatus) {
    throw new HttpError(
      500,
      "No se encontró el estatus de autoevaluación configurado."
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.buena_practica.update({
      where: { id: buenaPracticaId },
      data: {
        estatus_id: AUTOEVALUACION_ESTATUS_ID,
        actualizado_por_id: Number(cambiado_por_id),
        updatedAt: new Date(),
      },
      include: {
        buena_practica_estatus: true,
      },
    });

    await tx.buena_practica_historial.create({
      data: {
        buena_practica_id: buenaPracticaId,
        estatus_anterior_id: bp.estatus_id,
        estatus_nuevo_id: AUTOEVALUACION_ESTATUS_ID,
        comentario:
          "La ficha fue validada y enviada a la etapa de autoevaluación.",
        cambiado_por_id: Number(cambiado_por_id),
        createdAt: new Date(),
      },
    });

    return {
      id: updated.id,
      estatus_id: updated.estatus_id,
      estatus: updated.buena_practica_estatus
        ? {
            id: updated.buena_practica_estatus.id,
            nombre: updated.buena_practica_estatus.nombre,
          }
        : null,
    };
  });

  return result;
}

export async function getAutoevaluacion(id) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const bp = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      buena_practica_estatus: true,
      buena_practica_autoevaluacion: {
        include: {
          buena_practica_autoevaluacion_respuesta: {
            include: {
              catalogo_autoevaluacion_criterio: true,
            },
            orderBy: {
              catalogo_autoevaluacion_criterio: {
                orden: "asc",
              },
            },
          },
        },
      },
    },
  });

  if (!bp || !bp.activo) {
    throw new HttpError(404, "La buena práctica no existe.");
  }

  const criterios = await prisma.catalogo_autoevaluacion_criterio.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
  });

  const respuestasMap = new Map(
    (bp.buena_practica_autoevaluacion?.buena_practica_autoevaluacion_respuesta ||
      []).map((item) => [item.catalogo_autoevaluacion_criterio_id, item])
  );

  const respuestas = criterios.map((criterio) => {
    const respuesta = respuestasMap.get(criterio.id);

    return {
      catalogo_autoevaluacion_criterio_id: criterio.id,
      clave: criterio.clave,
      nombre: criterio.nombre,
      descripcion: criterio.descripcion,
      orden: criterio.orden,
      nivel: respuesta?.nivel ?? null,
      justificacion: respuesta?.justificacion ?? "",
    };
  });

  return {
    buena_practica_id: bp.id,
    estatus: bp.buena_practica_estatus
      ? {
          id: bp.buena_practica_estatus.id,
          clave: bp.buena_practica_estatus.clave,
          nombre: bp.buena_practica_estatus.nombre,
          permite_edicion: bp.buena_practica_estatus.permite_edicion,
        }
      : null,
    autoevaluacion: bp.buena_practica_autoevaluacion
      ? {
          id: bp.buena_practica_autoevaluacion.id,
          puntaje_total: bp.buena_practica_autoevaluacion.puntaje_total,
          interpretacion: bp.buena_practica_autoevaluacion.interpretacion,
          completada: bp.buena_practica_autoevaluacion.completada,
          enviada_evaluacion_pares:
            bp.buena_practica_autoevaluacion.enviada_evaluacion_pares,
          evaluado_por_id: bp.buena_practica_autoevaluacion.evaluado_por_id,
        }
      : null,
    respuestas,
  };
}

export async function updateAutoevaluacion(id, payload) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const { evaluado_por_id, respuestas = [] } = payload;

  if (!evaluado_por_id || Number.isNaN(Number(evaluado_por_id))) {
    throw new HttpError(
      400,
      "Es necesario indicar el usuario que guarda la autoevaluación."
    );
  }

  if (!Array.isArray(respuestas)) {
    throw new HttpError(400, "El campo 'respuestas' debe ser un arreglo.");
  }

  const bp = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      buena_practica_estatus: true,
      buena_practica_autoevaluacion: true,
    },
  });

  if (!bp || !bp.activo) {
    throw new HttpError(404, "La buena práctica no existe.");
  }

  const estatusClave = bp.buena_practica_estatus?.clave;

  if (
    estatusClave !== "AUTOEVALUACION" &&
    estatusClave !== "AUTOEVALUACION_RECHAZADA"
  ) {
    throw new HttpError(
      409,
      "La buena práctica no se encuentra en una etapa válida para capturar la autoevaluación."
    );
  }

  const criterios = await prisma.catalogo_autoevaluacion_criterio.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
  });

  const criteriosIds = criterios.map((item) => item.id);
  const respuestasFiltradas = respuestas.filter((item) =>
    criteriosIds.includes(Number(item.catalogo_autoevaluacion_criterio_id))
  );

  for (const item of respuestasFiltradas) {
    const nivel = item.nivel;

    if (nivel !== null && nivel !== undefined) {
      if (![0, 1, 2].includes(Number(nivel))) {
        throw new HttpError(
          400,
          "Cada nivel de autoevaluación debe ser 0, 1 o 2."
        );
      }
    }
  }

  const criteriosRespondidos = respuestasFiltradas.filter(
    (item) =>
      item.nivel !== null &&
      item.nivel !== undefined &&
      String(item.justificacion || "").trim()
  );

  const puntajeTotal = respuestasFiltradas.reduce((acc, item) => {
    if (item.nivel === null || item.nivel === undefined) return acc;
    return acc + Number(item.nivel);
  }, 0);

  const completada =
    criteriosRespondidos.length === criterios.length &&
    criterios.length > 0;

  const interpretacion = getInterpretacionAutoevaluacion(puntajeTotal);

  const result = await prisma.$transaction(async (tx) => {
    let autoevaluacion;

    if (bp.buena_practica_autoevaluacion) {
      autoevaluacion = await tx.buena_practica_autoevaluacion.update({
        where: { buena_practica_id: buenaPracticaId },
        data: {
          puntaje_total: puntajeTotal,
          interpretacion,
          completada,
          evaluado_por_id: Number(evaluado_por_id),
        },
      });
    } else {
      autoevaluacion = await tx.buena_practica_autoevaluacion.create({
        data: {
          buena_practica_id: buenaPracticaId,
          puntaje_total: puntajeTotal,
          interpretacion,
          completada,
          evaluado_por_id: Number(evaluado_por_id),
        },
      });
    }

    await tx.buena_practica_autoevaluacion_respuesta.deleteMany({
      where: {
        buena_practica_autoevaluacion_id: autoevaluacion.id,
      },
    });

    if (respuestasFiltradas.length > 0) {
      await tx.buena_practica_autoevaluacion_respuesta.createMany({
        data: respuestasFiltradas.map((item) => ({
          buena_practica_autoevaluacion_id: autoevaluacion.id,
          catalogo_autoevaluacion_criterio_id: Number(
            item.catalogo_autoevaluacion_criterio_id
          ),
          nivel:
            item.nivel === null || item.nivel === undefined
              ? null
              : Number(item.nivel),
          justificacion: String(item.justificacion || "").trim() || null,
        })),
      });
    }

    const respuestasActualizadas =
      await tx.buena_practica_autoevaluacion_respuesta.findMany({
        where: {
          buena_practica_autoevaluacion_id: autoevaluacion.id,
        },
        include: {
          catalogo_autoevaluacion_criterio: true,
        },
        orderBy: {
          catalogo_autoevaluacion_criterio: {
            orden: "asc",
          },
        },
      });

    return {
      autoevaluacion: {
        id: autoevaluacion.id,
        puntaje_total: autoevaluacion.puntaje_total,
        interpretacion: autoevaluacion.interpretacion,
        completada: autoevaluacion.completada,
        enviada_evaluacion_pares:
          autoevaluacion.enviada_evaluacion_pares,
        evaluado_por_id: autoevaluacion.evaluado_por_id,
      },
      respuestas: respuestasActualizadas.map((item) => ({
        catalogo_autoevaluacion_criterio_id:
          item.catalogo_autoevaluacion_criterio_id,
        clave: item.catalogo_autoevaluacion_criterio?.clave,
        nombre: item.catalogo_autoevaluacion_criterio?.nombre,
        descripcion: item.catalogo_autoevaluacion_criterio?.descripcion,
        orden: item.catalogo_autoevaluacion_criterio?.orden,
        nivel: item.nivel,
        justificacion: item.justificacion || "",
      })),
    };
  });

  return result;
}

function getInterpretacionAutoevaluacion(score) {
  if (score >= 16) {
    return "PRACTICA_LISTA";
  }

  if (score >= 12) {
    return "AJUSTES_MENORES";
  }

  return "REVISION_INTERNA";
}

export async function sendAutoevaluacionToPares(id, payload = {}) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const { cambiado_por_id } = payload;

  if (!cambiado_por_id || Number.isNaN(Number(cambiado_por_id))) {
    throw new HttpError(
      400,
      "Es necesario indicar el usuario que realiza el envío."
    );
  }

  const bp = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      buena_practica_estatus: true,
      buena_practica_autoevaluacion: {
        include: {
          buena_practica_autoevaluacion_respuesta: true,
        },
      },
    },
  });

  if (!bp || !bp.activo) {
    throw new HttpError(404, "La buena práctica no existe.");
  }

  const estatusClave = bp.buena_practica_estatus?.clave;

  if (
    estatusClave !== "AUTOEVALUACION" &&
    estatusClave !== "AUTOEVALUACION_RECHAZADA"
  ) {
    throw new HttpError(
      409,
      "La buena práctica no se encuentra en una etapa válida para enviarse a evaluación de pares."
    );
  }

  if (!bp.buena_practica_autoevaluacion) {
    throw new HttpError(
      409,
      "La buena práctica no cuenta con una autoevaluación capturada."
    );
  }

  const criteriosActivos = await prisma.catalogo_autoevaluacion_criterio.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
  });

  const respuestas =
    bp.buena_practica_autoevaluacion.buena_practica_autoevaluacion_respuesta || [];

  const respuestasMap = new Map(
    respuestas.map((item) => [item.catalogo_autoevaluacion_criterio_id, item])
  );

  const pendientes = [];

  for (const criterio of criteriosActivos) {
    const respuesta = respuestasMap.get(criterio.id);

    if (!respuesta) {
      pendientes.push(`Falta capturar el criterio "${criterio.nombre}".`);
      continue;
    }

    if (respuesta.nivel === null || respuesta.nivel === undefined) {
      pendientes.push(`Falta seleccionar el nivel para "${criterio.nombre}".`);
    }

    if (!String(respuesta.justificacion || "").trim()) {
      pendientes.push(`Falta la justificación para "${criterio.nombre}".`);
    }
  }

  const puntajeTotal = respuestas.reduce((acc, item) => {
    if (item.nivel === null || item.nivel === undefined) return acc;
    return acc + Number(item.nivel);
  }, 0);

  if (pendientes.length > 0) {
    throw new HttpError(
      409,
      "La autoevaluación está incompleta.",
      {
        pendientes,
        puntaje_total: puntajeTotal,
      }
    );
  }

  if (puntajeTotal < 16) {
    throw new HttpError(
      409,
      "La autoevaluación no alcanza el puntaje mínimo para enviarse a evaluación de pares.",
      {
        puntaje_total: puntajeTotal,
        interpretacion: getInterpretacionAutoevaluacion(puntajeTotal),
      }
    );
  }

  const EVALUACION_PARES_ESTATUS_ID = 4; // ajusta si tu id real es otro

  const nuevoEstatus = await prisma.buena_practica_estatus.findUnique({
    where: { id: EVALUACION_PARES_ESTATUS_ID },
  });

  if (!nuevoEstatus) {
    throw new HttpError(
      500,
      "No se encontró el estatus de evaluación de pares configurado."
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.buena_practica_autoevaluacion.update({
      where: {
        buena_practica_id: buenaPracticaId,
      },
      data: {
        puntaje_total: puntajeTotal,
        interpretacion: getInterpretacionAutoevaluacion(puntajeTotal),
        completada: true,
        enviada_evaluacion_pares: true,
        evaluado_por_id: Number(cambiado_por_id),
      },
    });

    const updated = await tx.buena_practica.update({
      where: { id: buenaPracticaId },
      data: {
        estatus_id: EVALUACION_PARES_ESTATUS_ID,
        actualizado_por_id: Number(cambiado_por_id),
        updatedAt: new Date(),
      },
      include: {
        buena_practica_estatus: true,
      },
    });

    await tx.buena_practica_historial.create({
      data: {
        buena_practica_id: buenaPracticaId,
        estatus_anterior_id: bp.estatus_id,
        estatus_nuevo_id: EVALUACION_PARES_ESTATUS_ID,
        comentario:
          "La autoevaluación fue completada y enviada a evaluación de pares.",
        cambiado_por_id: Number(cambiado_por_id),
        createdAt: new Date(),
      },
    });

    return {
      buena_practica_id: updated.id,
      estatus: updated.buena_practica_estatus
        ? {
            id: updated.buena_practica_estatus.id,
            clave: updated.buena_practica_estatus.clave,
            nombre: updated.buena_practica_estatus.nombre,
            permite_edicion: updated.buena_practica_estatus.permite_edicion,
          }
        : null,
      puntaje_total: puntajeTotal,
      interpretacion: getInterpretacionAutoevaluacion(puntajeTotal),
    };
  });

  return result;
}

export async function getEvaluacionPares(id) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const bp = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      buena_practica_estatus: true,
      buena_practica_evaluacion_pares: {
        include: {
          buena_practica_evaluacion_pares_respuesta: {
            include: {
              catalogo_evaluacion_pares_criterio: true,
            },
            orderBy: {
              catalogo_evaluacion_pares_criterio: {
                orden: "asc",
              },
            },
          },
        },
      },
    },
  });

  if (!bp || !bp.activo) {
    throw new HttpError(404, "La buena práctica no existe.");
  }

  const criterios = await prisma.catalogo_evaluacion_pares_criterio.findMany({
    where: { activo: true },
    include: {
      catalogo_evaluacion_pares_rubrica: {
        orderBy: { nivel: "desc" },
      },
    },
    orderBy: { orden: "asc" },
  });

  const respuestasMap = new Map(
    (
      bp.buena_practica_evaluacion_pares
        ?.buena_practica_evaluacion_pares_respuesta || []
    ).map((item) => [item.catalogo_evaluacion_pares_criterio_id, item])
  );

  const respuestas = criterios.map((criterio) => {
    const respuesta = respuestasMap.get(criterio.id);

    return {
      catalogo_evaluacion_pares_criterio_id: criterio.id,
      clave: criterio.clave,
      nombre: criterio.nombre,
      descripcion: criterio.descripcion,
      es_critico: criterio.es_critico,
      orden: criterio.orden,
      nivel: respuesta?.nivel ?? null,
      justificacion: respuesta?.justificacion ?? "",
      rubricas: (criterio.catalogo_evaluacion_pares_rubrica || []).map(
        (rubrica) => ({
          nivel: rubrica.nivel,
          descripcion: rubrica.descripcion,
        })
      ),
    };
  });

  return {
    buena_practica_id: bp.id,
    estatus: bp.buena_practica_estatus
      ? {
          id: bp.buena_practica_estatus.id,
          clave: bp.buena_practica_estatus.clave,
          nombre: bp.buena_practica_estatus.nombre,
          permite_edicion: bp.buena_practica_estatus.permite_edicion,
        }
      : null,
    evaluacion_pares: bp.buena_practica_evaluacion_pares
      ? {
          id: bp.buena_practica_evaluacion_pares.id,
          puntaje_total_valido:
            bp.buena_practica_evaluacion_pares.puntaje_total_valido,
          puntaje_maximo_valido:
            bp.buena_practica_evaluacion_pares.puntaje_maximo_valido,
          promedio: bp.buena_practica_evaluacion_pares.promedio,
          recomendacion: bp.buena_practica_evaluacion_pares.recomendacion,
          observaciones_clave:
            bp.buena_practica_evaluacion_pares.observaciones_clave,
          completada: bp.buena_practica_evaluacion_pares.completada,
          enviada_evaluacion_institucional:
            bp.buena_practica_evaluacion_pares
              .enviada_evaluacion_institucional,
          evaluado_por_id: bp.buena_practica_evaluacion_pares.evaluado_por_id,
        }
      : null,
    respuestas,
  };
}

export async function updateEvaluacionPares(id, payload) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const {
    evaluado_por_id,
    observaciones_clave = "",
    respuestas = [],
  } = payload;

  if (!evaluado_por_id || Number.isNaN(Number(evaluado_por_id))) {
    throw new HttpError(
      400,
      "Es necesario indicar el usuario que guarda la evaluación de pares."
    );
  }

  if (!Array.isArray(respuestas)) {
    throw new HttpError(400, "El campo 'respuestas' debe ser un arreglo.");
  }

  const bp = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      buena_practica_estatus: true,
      buena_practica_evaluacion_pares: true,
    },
  });

  if (!bp || !bp.activo) {
    throw new HttpError(404, "La buena práctica no existe.");
  }

  const estatusClave = bp.buena_practica_estatus?.clave;

  if (
    estatusClave !== "EVALUACION_PARES" &&
    estatusClave !== "EVALUACION_PARES_RECHAZADA"
  ) {
    throw new HttpError(
      409,
      "La buena práctica no se encuentra en una etapa válida para capturar la evaluación de pares."
    );
  }

  const criterios = await prisma.catalogo_evaluacion_pares_criterio.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
  });

  const criteriosIds = criterios.map((item) => item.id);
  const respuestasFiltradas = respuestas.filter((item) =>
    criteriosIds.includes(Number(item.catalogo_evaluacion_pares_criterio_id))
  );

  for (const item of respuestasFiltradas) {
    const nivel = item.nivel;

    if (
      nivel !== null &&
      nivel !== undefined &&
      !["1", "2", "3", "4", "NA"].includes(String(nivel))
    ) {
      throw new HttpError(
        400,
        "Cada nivel de evaluación de pares debe ser 1, 2, 3, 4 o NA."
      );
    }
  }

  const metricas = calcularMetricasEvaluacionPares(criterios, respuestasFiltradas);

  const completada =
    metricas.criterios_evaluados === criterios.length &&
    criterios.length > 0 &&
    metricas.justificaciones_completas === criterios.length;

  const result = await prisma.$transaction(async (tx) => {
    let evaluacion;

    if (bp.buena_practica_evaluacion_pares) {
      evaluacion = await tx.buena_practica_evaluacion_pares.update({
        where: { buena_practica_id: buenaPracticaId },
        data: {
          puntaje_total_valido: metricas.puntaje_total_valido,
          puntaje_maximo_valido: metricas.puntaje_maximo_valido,
          promedio: metricas.promedio,
          recomendacion: metricas.recomendacion,
          observaciones_clave: String(observaciones_clave || "").trim() || null,
          completada,
          evaluado_por_id: Number(evaluado_por_id),
        },
      });
    } else {
      evaluacion = await tx.buena_practica_evaluacion_pares.create({
        data: {
          buena_practica_id: buenaPracticaId,
          puntaje_total_valido: metricas.puntaje_total_valido,
          puntaje_maximo_valido: metricas.puntaje_maximo_valido,
          promedio: metricas.promedio,
          recomendacion: metricas.recomendacion,
          observaciones_clave: String(observaciones_clave || "").trim() || null,
          completada,
          evaluado_por_id: Number(evaluado_por_id),
        },
      });
    }

    await tx.buena_practica_evaluacion_pares_respuesta.deleteMany({
      where: {
        buena_practica_evaluacion_pares_id: evaluacion.id,
      },
    });

    if (respuestasFiltradas.length > 0) {
      await tx.buena_practica_evaluacion_pares_respuesta.createMany({
        data: respuestasFiltradas.map((item) => ({
          buena_practica_evaluacion_pares_id: evaluacion.id,
          catalogo_evaluacion_pares_criterio_id: Number(
            item.catalogo_evaluacion_pares_criterio_id
          ),
          nivel:
            item.nivel === null || item.nivel === undefined
              ? null
              : String(item.nivel),
          justificacion: String(item.justificacion || "").trim() || null,
        })),
      });
    }

    const respuestasActualizadas =
      await tx.buena_practica_evaluacion_pares_respuesta.findMany({
        where: {
          buena_practica_evaluacion_pares_id: evaluacion.id,
        },
        include: {
          catalogo_evaluacion_pares_criterio: true,
        },
        orderBy: {
          catalogo_evaluacion_pares_criterio: {
            orden: "asc",
          },
        },
      });

    return {
      evaluacion_pares: {
        id: evaluacion.id,
        puntaje_total_valido: evaluacion.puntaje_total_valido,
        puntaje_maximo_valido: evaluacion.puntaje_maximo_valido,
        promedio: evaluacion.promedio,
        recomendacion: evaluacion.recomendacion,
        observaciones_clave: evaluacion.observaciones_clave,
        completada: evaluacion.completada,
        enviada_evaluacion_institucional:
          evaluacion.enviada_evaluacion_institucional,
        evaluado_por_id: evaluacion.evaluado_por_id,
      },
      metricas,
      respuestas: respuestasActualizadas.map((item) => ({
        catalogo_evaluacion_pares_criterio_id:
          item.catalogo_evaluacion_pares_criterio_id,
        clave: item.catalogo_evaluacion_pares_criterio?.clave,
        nombre: item.catalogo_evaluacion_pares_criterio?.nombre,
        descripcion: item.catalogo_evaluacion_pares_criterio?.descripcion,
        es_critico: item.catalogo_evaluacion_pares_criterio?.es_critico,
        orden: item.catalogo_evaluacion_pares_criterio?.orden,
        nivel: item.nivel,
        justificacion: item.justificacion || "",
      })),
    };
  });

  return result;
}

function calcularMetricasEvaluacionPares(criterios, respuestas) {
  const respuestasMap = new Map(
    respuestas.map((item) => [Number(item.catalogo_evaluacion_pares_criterio_id), item])
  );

  let puntaje_total_valido = 0;
  let puntaje_maximo_valido = 0;
  let criterios_evaluados = 0;
  let justificaciones_completas = 0;
  let tiene_critico_en_uno = false;

  for (const criterio of criterios) {
    const respuesta = respuestasMap.get(criterio.id);

    if (!respuesta || respuesta.nivel === null || respuesta.nivel === undefined) {
      continue;
    }

    criterios_evaluados += 1;

    if (String(respuesta.justificacion || "").trim()) {
      justificaciones_completas += 1;
    }

    const nivel = String(respuesta.nivel);

    if (nivel === "NA") {
      continue;
    }

    const nivelNumerico = Number(nivel);

    puntaje_total_valido += nivelNumerico;
    puntaje_maximo_valido += 4;

    if (criterio.es_critico && nivelNumerico === 1) {
      tiene_critico_en_uno = true;
    }
  }

  const promedio =
    puntaje_maximo_valido > 0
      ? Number((puntaje_total_valido / puntaje_maximo_valido).toFixed(4))
      : 0;

  const recomendacion = getRecomendacionEvaluacionPares({
    puntaje_total_valido,
    tiene_critico_en_uno,
  });

  return {
    puntaje_total_valido,
    puntaje_maximo_valido,
    promedio,
    criterios_evaluados,
    justificaciones_completas,
    tiene_critico_en_uno,
    recomendacion,
  };
}

function getRecomendacionEvaluacionPares({
  puntaje_total_valido,
  tiene_critico_en_uno,
}) {
  if (tiene_critico_en_uno) {
    return "NO_AVANZAR";
  }

  if (puntaje_total_valido >= 34) {
    return "RECONOCER_BUENA_PRACTICA";
  }

  if (puntaje_total_valido >= 26) {
    return "AVANZAR_MEJORAS_MENORES";
  }

  if (puntaje_total_valido >= 18) {
    return "REQUIERE_FORTALECIMIENTO";
  }

  return "NO_AVANZAR";
}

export async function dictaminarEvaluacionPares(id, payload) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const {
    dictamen,
    evaluado_por_id,
    observaciones_clave = "",
  } = payload;

  if (!dictamen || !["ACEPTADA", "RECHAZADA"].includes(String(dictamen))) {
    throw new HttpError(
      400,
      "El campo 'dictamen' debe ser 'ACEPTADA' o 'RECHAZADA'."
    );
  }

  if (!evaluado_por_id || Number.isNaN(Number(evaluado_por_id))) {
    throw new HttpError(
      400,
      "Es necesario indicar el usuario que emite el dictamen."
    );
  }

  if (!String(observaciones_clave).trim()) {
    throw new HttpError(
      400,
      "Las observaciones del dictamen son obligatorias."
    );
  }

  const bp = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      buena_practica_estatus: true,
      buena_practica_evaluacion_pares: {
        include: {
          buena_practica_evaluacion_pares_respuesta: true,
        },
      },
    },
  });

  if (!bp || !bp.activo) {
    throw new HttpError(404, "La buena práctica no existe.");
  }

  const estatusClave = bp.buena_practica_estatus?.clave;

  if (
    estatusClave !== "EVALUACION_PARES" &&
    estatusClave !== "EVALUACION_PARES_RECHAZADA"
  ) {
    throw new HttpError(
      409,
      "La buena práctica no se encuentra en una etapa válida para emitir dictamen de pares."
    );
  }

  if (!bp.buena_practica_evaluacion_pares) {
    throw new HttpError(
      409,
      "No existe una evaluación de pares capturada para esta buena práctica."
    );
  }

  const criterios = await prisma.catalogo_evaluacion_pares_criterio.findMany({
    where: { activo: true },
    orderBy: { orden: "asc" },
  });

  const respuestas =
    bp.buena_practica_evaluacion_pares.buena_practica_evaluacion_pares_respuesta ||
    [];

  const metricas = calcularMetricasEvaluacionPares(criterios, respuestas);

  const evaluacionCompleta =
    metricas.criterios_evaluados === criterios.length &&
    metricas.justificaciones_completas === criterios.length;

  if (!evaluacionCompleta) {
    throw new HttpError(
      409,
      "La evaluación de pares está incompleta. Deben capturarse todos los criterios con calificación y justificación.",
      {
        metricas,
      }
    );
  }

  if (
    dictamen === "ACEPTADA" &&
    metricas.recomendacion === "NO_AVANZAR"
  ) {
    throw new HttpError(
      409,
      "La evaluación actual no cumple las condiciones para ser aceptada.",
      {
        metricas,
      }
    );
  }

  const ESTATUS_EVALUACION_INSTITUCIONAL = 6;
  const ESTATUS_EVALUACION_PARES_RECHAZADA = 5;

  const nuevoEstatusId =
    dictamen === "ACEPTADA"
      ? ESTATUS_EVALUACION_INSTITUCIONAL
      : ESTATUS_EVALUACION_PARES_RECHAZADA;

  const nuevoEstatus = await prisma.buena_practica_estatus.findUnique({
    where: { id: nuevoEstatusId },
  });

  if (!nuevoEstatus) {
    throw new HttpError(
      500,
      "No se encontró el estatus destino configurado para el dictamen."
    );
  }

  const comentarioHistorial =
    dictamen === "ACEPTADA"
      ? "La evaluación de pares fue aceptada y la buena práctica avanzó a evaluación institucional."
      : "La evaluación de pares fue rechazada y la buena práctica fue devuelta para corrección.";

  const result = await prisma.$transaction(async (tx) => {
    const evaluacionActualizada =
      await tx.buena_practica_evaluacion_pares.update({
        where: {
          buena_practica_id: buenaPracticaId,
        },
        data: {
          puntaje_total_valido: metricas.puntaje_total_valido,
          puntaje_maximo_valido: metricas.puntaje_maximo_valido,
          promedio: metricas.promedio,
          recomendacion: metricas.recomendacion,
          observaciones_clave: String(observaciones_clave).trim(),
          completada: true,
          enviada_evaluacion_institucional: dictamen === "ACEPTADA",
          evaluado_por_id: Number(evaluado_por_id),
        },
      });

    const buenaPracticaActualizada = await tx.buena_practica.update({
      where: { id: buenaPracticaId },
      data: {
        estatus_id: nuevoEstatusId,
        actualizado_por_id: Number(evaluado_por_id),
        updatedAt: new Date(),
      },
      include: {
        buena_practica_estatus: true,
      },
    });

    await tx.buena_practica_historial.create({
      data: {
        buena_practica_id: buenaPracticaId,
        estatus_anterior_id: bp.estatus_id,
        estatus_nuevo_id: nuevoEstatusId,
        comentario: comentarioHistorial,
        cambiado_por_id: Number(evaluado_por_id),
        createdAt: new Date(),
      },
    });

    return {
      buena_practica_id: buenaPracticaActualizada.id,
      dictamen,
      estatus: buenaPracticaActualizada.buena_practica_estatus
        ? {
            id: buenaPracticaActualizada.buena_practica_estatus.id,
            clave: buenaPracticaActualizada.buena_practica_estatus.clave,
            nombre: buenaPracticaActualizada.buena_practica_estatus.nombre,
            permite_edicion:
              buenaPracticaActualizada.buena_practica_estatus.permite_edicion,
          }
        : null,
      evaluacion_pares: {
        id: evaluacionActualizada.id,
        puntaje_total_valido: evaluacionActualizada.puntaje_total_valido,
        puntaje_maximo_valido: evaluacionActualizada.puntaje_maximo_valido,
        promedio: evaluacionActualizada.promedio,
        recomendacion: evaluacionActualizada.recomendacion,
        observaciones_clave: evaluacionActualizada.observaciones_clave,
        completada: evaluacionActualizada.completada,
        enviada_evaluacion_institucional:
          evaluacionActualizada.enviada_evaluacion_institucional,
      },
    };
  });

  return result;
}

export async function getEvaluacionInstitucional(id) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const bp = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      buena_practica_estatus: true,
      buena_practica_evaluacion_institucional: {
        include: {
          buena_practica_evaluacion_institucional_respuesta: {
            include: {
              catalogo_evaluacion_institucional_criterio: true,
            },
            orderBy: {
              catalogo_evaluacion_institucional_criterio: {
                orden: "asc",
              },
            },
          },
        },
      },
    },
  });

  if (!bp || !bp.activo) {
    throw new HttpError(404, "La buena práctica no existe.");
  }

  const criterios =
    await prisma.catalogo_evaluacion_institucional_criterio.findMany({
      where: { activo: true },
      include: {
        catalogo_evaluacion_institucional_rubrica: {
          orderBy: {
            nivel: "asc",
          },
        },
      },
      orderBy: {
        orden: "asc",
      },
    });

  const respuestasMap = new Map(
    (
      bp.buena_practica_evaluacion_institucional
        ?.buena_practica_evaluacion_institucional_respuesta || []
    ).map((item) => [item.catalogo_evaluacion_institucional_criterio_id, item])
  );

  const respuestas = criterios.map((criterio) => {
    const respuesta = respuestasMap.get(criterio.id);

    return {
      catalogo_evaluacion_institucional_criterio_id: criterio.id,
      clave: criterio.clave,
      nombre: criterio.nombre,
      descripcion: criterio.descripcion,
      orden: criterio.orden,
      nivel: respuesta?.nivel ?? null,
      justificacion: respuesta?.justificacion ?? "",
      rubricas: (criterio.catalogo_evaluacion_institucional_rubrica || []).map(
        (rubrica) => ({
          nivel: rubrica.nivel,
          descripcion: rubrica.descripcion,
        })
      ),
    };
  });

  return {
    buena_practica_id: bp.id,
    titulo_buena_practica: bp.titulo,
    estatus: bp.buena_practica_estatus
      ? {
          id: bp.buena_practica_estatus.id,
          clave: bp.buena_practica_estatus.clave,
          nombre: bp.buena_practica_estatus.nombre,
          permite_edicion: bp.buena_practica_estatus.permite_edicion,
        }
      : null,
    evaluacion_institucional: bp.buena_practica_evaluacion_institucional
      ? {
          id: bp.buena_practica_evaluacion_institucional.id,
          puntaje_total: bp.buena_practica_evaluacion_institucional.puntaje_total,
          puntaje_maximo:
            bp.buena_practica_evaluacion_institucional.puntaje_maximo,
          promedio: bp.buena_practica_evaluacion_institucional.promedio,
          dictamen: bp.buena_practica_evaluacion_institucional.dictamen,
          observaciones_adicionales:
            bp.buena_practica_evaluacion_institucional
              .observaciones_adicionales,
          completada: bp.buena_practica_evaluacion_institucional.completada,
          dictaminada: bp.buena_practica_evaluacion_institucional.dictaminada,
          evaluado_por_id:
            bp.buena_practica_evaluacion_institucional.evaluado_por_id,
        }
      : null,
    respuestas,
  };
}

export async function dictaminarEvaluacionInstitucional(id, payload) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const {
    dictamen,
    evaluado_por_id,
    observaciones_adicionales = "",
  } = payload;

  if (!dictamen || !["RECONOCIDA", "NO_RECONOCIDA"].includes(String(dictamen))) {
    throw new HttpError(
      400,
      "El campo 'dictamen' debe ser 'RECONOCIDA' o 'NO_RECONOCIDA'."
    );
  }

  if (!evaluado_por_id || Number.isNaN(Number(evaluado_por_id))) {
    throw new HttpError(
      400,
      "Es necesario indicar el usuario que emite el dictamen."
    );
  }

  if (!String(observaciones_adicionales).trim()) {
    throw new HttpError(
      400,
      "Las observaciones adicionales son obligatorias."
    );
  }

  const bp = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      buena_practica_estatus: true,
      buena_practica_evaluacion_institucional: {
        include: {
          buena_practica_evaluacion_institucional_respuesta: true,
        },
      },
    },
  });

  if (!bp || !bp.activo) {
    throw new HttpError(404, "La buena práctica no existe.");
  }

  const estatusClave = bp.buena_practica_estatus?.clave;

  if (
    estatusClave !== "EVALUACION_INSTITUCIONAL" &&
    estatusClave !== "EVALUACION_INSTITUCIONAL_RECHAZADA"
  ) {
    throw new HttpError(
      409,
      "La buena práctica no se encuentra en una etapa válida para emitir dictamen institucional."
    );
  }

  if (!bp.buena_practica_evaluacion_institucional) {
    throw new HttpError(
      409,
      "No existe una evaluación institucional capturada para esta buena práctica."
    );
  }

  const criterios =
    await prisma.catalogo_evaluacion_institucional_criterio.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    });

  const respuestas =
    bp.buena_practica_evaluacion_institucional
      .buena_practica_evaluacion_institucional_respuesta || [];

  const metricas = calcularMetricasEvaluacionInstitucional(criterios, respuestas);

  const evaluacionCompleta =
    metricas.criterios_evaluados === criterios.length &&
    metricas.justificaciones_completas === criterios.length;

  if (!evaluacionCompleta) {
    throw new HttpError(
      409,
      "La evaluación institucional está incompleta. Deben capturarse todos los criterios con nivel y justificación.",
      {
        metricas,
      }
    );
  }

  const ESTATUS_LIBERADA = 8;
  const ESTATUS_EVALUACION_INSTITUCIONAL_RECHAZADA = 7;

  const nuevoEstatusId =
    dictamen === "RECONOCIDA"
      ? ESTATUS_LIBERADA
      : ESTATUS_EVALUACION_INSTITUCIONAL_RECHAZADA;

  const nuevoEstatus = await prisma.buena_practica_estatus.findUnique({
    where: { id: nuevoEstatusId },
  });

  if (!nuevoEstatus) {
    throw new HttpError(
      500,
      "No se encontró el estatus destino configurado para el dictamen institucional."
    );
  }

  const comentarioHistorial =
    dictamen === "RECONOCIDA"
      ? "La evaluación institucional fue favorable y la buena práctica fue liberada."
      : "La evaluación institucional no fue favorable y la buena práctica fue rechazada institucionalmente.";

  const result = await prisma.$transaction(async (tx) => {
    const evaluacionActualizada =
      await tx.buena_practica_evaluacion_institucional.update({
        where: {
          buena_practica_id: buenaPracticaId,
        },
        data: {
          puntaje_total: metricas.puntaje_total,
          puntaje_maximo: metricas.puntaje_maximo,
          promedio: metricas.promedio,
          dictamen: String(dictamen),
          observaciones_adicionales: String(observaciones_adicionales).trim(),
          completada: true,
          dictaminada: true,
          evaluado_por_id: Number(evaluado_por_id),
        },
      });

    const buenaPracticaActualizada = await tx.buena_practica.update({
      where: { id: buenaPracticaId },
      data: {
        estatus_id: nuevoEstatusId,
        actualizado_por_id: Number(evaluado_por_id),
        updatedAt: new Date(),
      },
      include: {
        buena_practica_estatus: true,
      },
    });

    await tx.buena_practica_historial.create({
      data: {
        buena_practica_id: buenaPracticaId,
        estatus_anterior_id: bp.estatus_id,
        estatus_nuevo_id: nuevoEstatusId,
        comentario: comentarioHistorial,
        cambiado_por_id: Number(evaluado_por_id),
        createdAt: new Date(),
      },
    });

    return {
      buena_practica_id: buenaPracticaActualizada.id,
      dictamen,
      estatus: buenaPracticaActualizada.buena_practica_estatus
        ? {
            id: buenaPracticaActualizada.buena_practica_estatus.id,
            clave: buenaPracticaActualizada.buena_practica_estatus.clave,
            nombre: buenaPracticaActualizada.buena_practica_estatus.nombre,
            permite_edicion:
              buenaPracticaActualizada.buena_practica_estatus.permite_edicion,
          }
        : null,
      evaluacion_institucional: {
        id: evaluacionActualizada.id,
        puntaje_total: evaluacionActualizada.puntaje_total,
        puntaje_maximo: evaluacionActualizada.puntaje_maximo,
        promedio: evaluacionActualizada.promedio,
        dictamen: evaluacionActualizada.dictamen,
        observaciones_adicionales:
          evaluacionActualizada.observaciones_adicionales,
        completada: evaluacionActualizada.completada,
        dictaminada: evaluacionActualizada.dictaminada,
      },
    };
  });

  return result;
}

function calcularMetricasEvaluacionInstitucional(criterios, respuestas) {
  const respuestasMap = new Map(
    respuestas.map((item) => [
      Number(item.catalogo_evaluacion_institucional_criterio_id),
      item,
    ])
  );

  let puntaje_total = 0;
  let puntaje_maximo = criterios.length * 3;
  let criterios_evaluados = 0;
  let justificaciones_completas = 0;

  for (const criterio of criterios) {
    const respuesta = respuestasMap.get(criterio.id);

    if (!respuesta || !respuesta.nivel) continue;

    criterios_evaluados += 1;

    if (String(respuesta.justificacion || "").trim()) {
      justificaciones_completas += 1;
    }

    puntaje_total += mapNivelInstitucionalToScore(respuesta.nivel);
  }

  const promedio =
    puntaje_maximo > 0
      ? Number((puntaje_total / puntaje_maximo).toFixed(4))
      : 0;

  const sugerencia = getSugerenciaEvaluacionInstitucional(puntaje_total);

  return {
    puntaje_total,
    puntaje_maximo,
    promedio,
    criterios_evaluados,
    justificaciones_completas,
    sugerencia,
  };
}

function mapNivelInstitucionalToScore(nivel) {
  switch (String(nivel)) {
    case "ALTO":
      return 3;
    case "MEDIO":
      return 2;
    case "BAJO":
    default:
      return 1;
  }
}

function getSugerenciaEvaluacionInstitucional(puntajeTotal) {
  if (puntajeTotal >= 10) {
    return "RECONOCIDA";
  }

  if (puntajeTotal >= 7) {
    return "REVISAR_CON_RESERVAS";
  }

  return "NO_RECONOCIDA";
}

export async function updateEvaluacionInstitucional(id, payload) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const {
    evaluado_por_id,
    observaciones_adicionales = "",
    respuestas = [],
  } = payload;

  if (!evaluado_por_id || Number.isNaN(Number(evaluado_por_id))) {
    throw new HttpError(
      400,
      "Es necesario indicar el usuario que guarda la evaluación institucional."
    );
  }

  if (!Array.isArray(respuestas)) {
    throw new HttpError(400, "El campo 'respuestas' debe ser un arreglo.");
  }

  const bp = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      buena_practica_estatus: true,
      buena_practica_evaluacion_institucional: true,
    },
  });

  if (!bp || !bp.activo) {
    throw new HttpError(404, "La buena práctica no existe.");
  }

  const estatusClave = bp.buena_practica_estatus?.clave;

  if (
    estatusClave !== "EVALUACION_INSTITUCIONAL" &&
    estatusClave !== "EVALUACION_INSTITUCIONAL_RECHAZADA"
  ) {
    throw new HttpError(
      409,
      "La buena práctica no se encuentra en una etapa válida para capturar la evaluación institucional."
    );
  }

  const criterios =
    await prisma.catalogo_evaluacion_institucional_criterio.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    });

  const criteriosIds = criterios.map((item) => item.id);

  const respuestasFiltradas = respuestas.filter((item) =>
    criteriosIds.includes(Number(item.catalogo_evaluacion_institucional_criterio_id))
  );

  for (const item of respuestasFiltradas) {
    const nivel = item.nivel;

    if (
      nivel !== null &&
      nivel !== undefined &&
      !["ALTO", "MEDIO", "BAJO"].includes(String(nivel))
    ) {
      throw new HttpError(
        400,
        "Cada nivel de evaluación institucional debe ser ALTO, MEDIO o BAJO."
      );
    }
  }

  const metricas = calcularMetricasEvaluacionInstitucional(
    criterios,
    respuestasFiltradas
  );

  const completada =
    metricas.criterios_evaluados === criterios.length &&
    metricas.justificaciones_completas === criterios.length &&
    criterios.length > 0;

  const result = await prisma.$transaction(async (tx) => {
    let evaluacion;

    if (bp.buena_practica_evaluacion_institucional) {
      evaluacion = await tx.buena_practica_evaluacion_institucional.update({
        where: { buena_practica_id: buenaPracticaId },
        data: {
          puntaje_total: metricas.puntaje_total,
          puntaje_maximo: metricas.puntaje_maximo,
          promedio: metricas.promedio,
          observaciones_adicionales:
            String(observaciones_adicionales || "").trim() || null,
          completada,
          evaluado_por_id: Number(evaluado_por_id),
        },
      });
    } else {
      evaluacion = await tx.buena_practica_evaluacion_institucional.create({
        data: {
          buena_practica_id: buenaPracticaId,
          puntaje_total: metricas.puntaje_total,
          puntaje_maximo: metricas.puntaje_maximo,
          promedio: metricas.promedio,
          observaciones_adicionales:
            String(observaciones_adicionales || "").trim() || null,
          completada,
          evaluado_por_id: Number(evaluado_por_id),
        },
      });
    }

    await tx.buena_practica_evaluacion_institucional_respuesta.deleteMany({
      where: {
        buena_practica_evaluacion_institucional_id: evaluacion.id,
      },
    });

    if (respuestasFiltradas.length > 0) {
      await tx.buena_practica_evaluacion_institucional_respuesta.createMany({
        data: respuestasFiltradas.map((item) => ({
          buena_practica_evaluacion_institucional_id: evaluacion.id,
          catalogo_evaluacion_institucional_criterio_id: Number(
            item.catalogo_evaluacion_institucional_criterio_id
          ),
          nivel:
            item.nivel === null || item.nivel === undefined
              ? null
              : String(item.nivel),
          justificacion: String(item.justificacion || "").trim() || null,
        })),
      });
    }

    const respuestasActualizadas =
      await tx.buena_practica_evaluacion_institucional_respuesta.findMany({
        where: {
          buena_practica_evaluacion_institucional_id: evaluacion.id,
        },
        include: {
          catalogo_evaluacion_institucional_criterio: true,
        },
        orderBy: {
          catalogo_evaluacion_institucional_criterio: {
            orden: "asc",
          },
        },
      });

    return {
      evaluacion_institucional: {
        id: evaluacion.id,
        puntaje_total: evaluacion.puntaje_total,
        puntaje_maximo: evaluacion.puntaje_maximo,
        promedio: evaluacion.promedio,
        dictamen: evaluacion.dictamen,
        observaciones_adicionales: evaluacion.observaciones_adicionales,
        completada: evaluacion.completada,
        dictaminada: evaluacion.dictaminada,
        evaluado_por_id: evaluacion.evaluado_por_id,
      },
      metricas,
      respuestas: respuestasActualizadas.map((item) => ({
        catalogo_evaluacion_institucional_criterio_id:
          item.catalogo_evaluacion_institucional_criterio_id,
        clave: item.catalogo_evaluacion_institucional_criterio?.clave,
        nombre: item.catalogo_evaluacion_institucional_criterio?.nombre,
        descripcion: item.catalogo_evaluacion_institucional_criterio?.descripcion,
        orden: item.catalogo_evaluacion_institucional_criterio?.orden,
        nivel: item.nivel,
        justificacion: item.justificacion || "",
      })),
    };
  });

  return result;
}

export async function getEvaluacionesResumen(id) {
  const buenaPracticaId = Number(id);

  if (!buenaPracticaId || Number.isNaN(buenaPracticaId)) {
    throw new HttpError(400, "El id de la buena práctica es inválido.");
  }

  const bp = await prisma.buena_practica.findUnique({
    where: { id: buenaPracticaId },
    include: {
      buena_practica_estatus: true,

      buena_practica_autoevaluacion: {
        include: {
          buena_practica_autoevaluacion_respuesta: {
            include: {
              catalogo_autoevaluacion_criterio: true,
            },
            orderBy: {
              catalogo_autoevaluacion_criterio: {
                orden: "asc",
              },
            },
          },
        },
      },

      buena_practica_evaluacion_pares: {
        include: {
          buena_practica_evaluacion_pares_respuesta: {
            include: {
              catalogo_evaluacion_pares_criterio: true,
            },
            orderBy: {
              catalogo_evaluacion_pares_criterio: {
                orden: "asc",
              },
            },
          },
        },
      },

      buena_practica_evaluacion_institucional: {
        include: {
          buena_practica_evaluacion_institucional_respuesta: {
            include: {
              catalogo_evaluacion_institucional_criterio: true,
            },
            orderBy: {
              catalogo_evaluacion_institucional_criterio: {
                orden: "asc",
              },
            },
          },
        },
      },
    },
  });

  if (!bp || !bp.activo) {
    throw new HttpError(404, "La buena práctica no existe.");
  }

  return {
    buena_practica_id: bp.id,
    titulo: bp.titulo,
    estatus_actual: bp.buena_practica_estatus
      ? {
          id: bp.buena_practica_estatus.id,
          clave: bp.buena_practica_estatus.clave,
          nombre: bp.buena_practica_estatus.nombre,
        }
      : null,

    autoevaluacion: {
      existe: Boolean(bp.buena_practica_autoevaluacion),
      data: bp.buena_practica_autoevaluacion
        ? {
            id: bp.buena_practica_autoevaluacion.id,
            puntaje_total: bp.buena_practica_autoevaluacion.puntaje_total,
            interpretacion: bp.buena_practica_autoevaluacion.interpretacion,
            completada: bp.buena_practica_autoevaluacion.completada,
            enviada_evaluacion_pares:
              bp.buena_practica_autoevaluacion.enviada_evaluacion_pares,
            evaluado_por_id: bp.buena_practica_autoevaluacion.evaluado_por_id,
            respuestas:
              bp.buena_practica_autoevaluacion
                .buena_practica_autoevaluacion_respuesta.map((item) => ({
                  criterio_id: item.catalogo_autoevaluacion_criterio_id,
                  criterio:
                    item.catalogo_autoevaluacion_criterio?.nombre || null,
                  nivel: item.nivel,
                  justificacion: item.justificacion || "",
                })) || [],
          }
        : null,
    },

    evaluacion_pares: {
      existe: Boolean(bp.buena_practica_evaluacion_pares),
      data: bp.buena_practica_evaluacion_pares
        ? {
            id: bp.buena_practica_evaluacion_pares.id,
            puntaje_total_valido:
              bp.buena_practica_evaluacion_pares.puntaje_total_valido,
            puntaje_maximo_valido:
              bp.buena_practica_evaluacion_pares.puntaje_maximo_valido,
            promedio: bp.buena_practica_evaluacion_pares.promedio,
            recomendacion: bp.buena_practica_evaluacion_pares.recomendacion,
            observaciones_clave:
              bp.buena_practica_evaluacion_pares.observaciones_clave,
            completada: bp.buena_practica_evaluacion_pares.completada,
            enviada_evaluacion_institucional:
              bp.buena_practica_evaluacion_pares
                .enviada_evaluacion_institucional,
            evaluado_por_id:
              bp.buena_practica_evaluacion_pares.evaluado_por_id,
            respuestas:
              bp.buena_practica_evaluacion_pares
                .buena_practica_evaluacion_pares_respuesta.map((item) => ({
                  criterio_id: item.catalogo_evaluacion_pares_criterio_id,
                  criterio:
                    item.catalogo_evaluacion_pares_criterio?.nombre || null,
                  nivel: item.nivel,
                  justificacion: item.justificacion || "",
                })) || [],
          }
        : null,
    },

    evaluacion_institucional: {
      existe: Boolean(bp.buena_practica_evaluacion_institucional),
      data: bp.buena_practica_evaluacion_institucional
        ? {
            id: bp.buena_practica_evaluacion_institucional.id,
            puntaje_total:
              bp.buena_practica_evaluacion_institucional.puntaje_total,
            puntaje_maximo:
              bp.buena_practica_evaluacion_institucional.puntaje_maximo,
            promedio: bp.buena_practica_evaluacion_institucional.promedio,
            dictamen: bp.buena_practica_evaluacion_institucional.dictamen,
            observaciones_adicionales:
              bp.buena_practica_evaluacion_institucional
                .observaciones_adicionales,
            completada: bp.buena_practica_evaluacion_institucional.completada,
            dictaminada:
              bp.buena_practica_evaluacion_institucional.dictaminada,
            evaluado_por_id:
              bp.buena_practica_evaluacion_institucional.evaluado_por_id,
            respuestas:
              bp.buena_practica_evaluacion_institucional
                .buena_practica_evaluacion_institucional_respuesta.map(
                  (item) => ({
                    criterio_id:
                      item.catalogo_evaluacion_institucional_criterio_id,
                    criterio:
                      item.catalogo_evaluacion_institucional_criterio?.nombre ||
                      null,
                    nivel: item.nivel,
                    justificacion: item.justificacion || "",
                  })
                ) || [],
          }
        : null,
    },
  };
}

