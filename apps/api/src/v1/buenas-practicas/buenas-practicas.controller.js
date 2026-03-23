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

export async function updateFundamentacion(req, res, next) {
  try {
    const { id } = req.params;

    const result = await buenasPracticasService.updateFundamentacion(
      id,
      req.body
    );

    return res.json({
      ok: true,
      message: "Fundamentación actualizada correctamente.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateMetodologia(req, res, next) {
  try {
    const { id } = req.params;

    const result = await buenasPracticasService.updateMetodologia(id, req.body);

    return res.json({
      ok: true,
      message: "Metodología y desarrollo actualizados correctamente.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateFoda(req, res, next) {
  try {
    const { id } = req.params;

    const result = await buenasPracticasService.updateFoda(id, req.body);

    return res.json({
      ok: true,
      message: "Análisis FODA actualizado correctamente.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateParticipacion(req, res, next) {
  try {
    const { id } = req.params;

    const result = await buenasPracticasService.updateParticipacion(
      id,
      req.body
    );

    return res.json({
      ok: true,
      message: "Participación y colaboración actualizadas correctamente.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateEvaluacion(req, res, next) {
  try {
    const { id } = req.params;

    const result = await buenasPracticasService.updateEvaluacion(
      id,
      req.body
    );

    return res.json({
      ok: true,
      message: "Evaluación e indicadores actualizados correctamente.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateImpacto(req, res, next) {
  try {
    const { id } = req.params;

    const result = await buenasPracticasService.updateImpacto(id, req.body);

    return res.json({
      ok: true,
      message: "Impacto y sostenibilidad actualizados correctamente.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateConclusiones(req, res, next) {
  try {
    const { id } = req.params;

    const result = await buenasPracticasService.updateConclusiones(
      id,
      req.body
    );

    return res.json({
      ok: true,
      message: "Conclusiones actualizadas correctamente.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBuenasPracticas(req, res, next) {
  try {
    const result = await buenasPracticasService.getBuenasPracticas(req.query);

    return res.json({
      ok: true,
      data: result.data,
      meta: result.meta,
    });
  } catch (error) {
    next(error);
  }
}