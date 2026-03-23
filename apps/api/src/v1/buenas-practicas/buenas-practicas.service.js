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