import * as buenasPracticasService from "./buenas-practicas.service.js";

export async function createBuenaPractica(req, res, next) {
  try {
    const result = await buenasPracticasService.createBuenaPractica(req.body);

    return res.status(201).json({
      ok: true,
      message: "Buena práctica creada correctamente.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBuenaPracticaById(req, res, next) {
  try {
    const { id } = req.params;

    const result = await buenasPracticasService.getBuenaPracticaById(id);

    return res.json({
      ok: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDatosGenerales(req, res, next) {
  try {
    const { id } = req.params;

    const result = await buenasPracticasService.updateDatosGenerales(id, req.body);

    return res.json({
      ok: true,
      message: "Datos generales actualizados correctamente.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateContextoProposito(req, res, next) {
  try {
    const { id } = req.params;

    const result = await buenasPracticasService.updateContextoProposito(
      id,
      req.body
    );

    return res.json({
      ok: true,
      message: "Contexto y propósito actualizados correctamente.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}