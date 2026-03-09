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