import * as service from "./unidades-organizacionales.service.js";

export async function getUnidadesOrganizacionales(req, res, next) {
  try {
    const data = await service.getUnidadesOrganizacionales();

    res.json({
      ok: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}