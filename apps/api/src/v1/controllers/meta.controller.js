import { prisma } from "../../lib/prisma.js";

export async function health(_req, res) {
  try {
    // Intentar una consulta mínima a la base de datos
    await prisma.$queryRaw`SELECT 1`;

    return res.json({
      ok: true,
      api: "up",
      db: "up",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check DB error:", error);

    return res.status(503).json({
      ok: false,
      api: "up",
      db: "down",
      message: "No fue posible conectar con la base de datos.",
      timestamp: new Date().toISOString(),
    });
  }
}

export function version(_req, res) {
  res.json({
    ok: true,
    name: "buenas-practicas-api",
    version: "v1",
  });
}

export async function getAlineaciones(_req, res, next) {
  try {
    const data = await prisma.catalogo_alineacion.findMany({
      where: { activo: true },
      orderBy: [
        { marco: "asc" },
        { grupo: "asc" },
        { orden: "asc" },
      ],
    });

    return res.json({
      ok: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

export async function getModeloEducativoElementos(_req, res, next) {
  try {
    const data = await prisma.catalogo_modelo_educativo_elemento.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    });

    return res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getPlanMexicoSectores(_req, res, next) {
  try {
    const data = await prisma.catalogo_plan_mexico_sector.findMany({
      where: { activo: true },
      orderBy: { orden: "asc" },
    });

    return res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}

export async function getOds(_req, res, next) {
  try {
    const data = await prisma.catalogo_ods.findMany({
      where: { activo: true },
      orderBy: { numero: "asc" },
    });

    return res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
}