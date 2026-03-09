import { prisma } from "../../lib/prisma.js";

export async function getUnidadesOrganizacionales() {
  return prisma.unidad_organizacional.findMany({
    where: { activo: true },
    orderBy: [
      { nivel: "asc" },
      { nombre: "asc" },
    ],
    select: {
      id: true,
      nombre: true,
      clave: true,
      id_institucional: true,
      tipo: true,
      padre_id: true,
      nivel: true,
    },
  });
}