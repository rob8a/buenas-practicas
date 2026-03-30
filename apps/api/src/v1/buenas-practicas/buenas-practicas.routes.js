import { Router } from "express";
import {
  createBuenaPractica,
  getBuenasPracticas,
  getValidacionEnvio,
  getAutoevaluacion,
  getEvaluacionPares,
  getBuenaPracticaById,
  getEvaluacionInstitucional,
  getEvaluacionesResumen,
  sendToAutoevaluacion,
  sendAutoevaluacionToPares,
  dictaminarEvaluacionPares,
  dictaminarEvaluacionInstitucional,
  updateDatosGenerales,
  updateContextoProposito,
  updateFundamentacion,
  updateMetodologia,
  updateFoda,
  updateParticipacion,
  updateEvaluacion,
  updateImpacto,
  updateConclusiones,
  updateAutoevaluacion,
  updateEvaluacionPares,
  updateEvaluacionInstitucional,
} from "./buenas-practicas.controller.js";

const router = Router();

router.post("/", createBuenaPractica);
router.get("/", getBuenasPracticas);
router.get("/:id/validacion-envio", getValidacionEnvio);
router.get("/:id/autoevaluacion", getAutoevaluacion);
router.get("/:id/evaluacion-pares", getEvaluacionPares);
router.get("/:id", getBuenaPracticaById);
router.get("/:id/evaluacion-institucional", getEvaluacionInstitucional);
router.get("/:id/evaluaciones", getEvaluacionesResumen);
router.post("/:id/enviar-autoevaluacion", sendToAutoevaluacion);
router.post("/:id/autoevaluacion/enviar", sendAutoevaluacionToPares);
router.post("/:id/evaluacion-pares/dictaminar", dictaminarEvaluacionPares);
router.post("/:id/evaluacion-institucional/dictaminar", dictaminarEvaluacionInstitucional);
router.patch("/:id/datos-generales", updateDatosGenerales);
router.patch("/:id/contexto-proposito", updateContextoProposito);
router.patch("/:id/fundamentacion", updateFundamentacion);
router.patch("/:id/metodologia", updateMetodologia);
router.patch("/:id/foda", updateFoda);
router.patch("/:id/participacion", updateParticipacion);
router.patch("/:id/evaluacion", updateEvaluacion);
router.patch("/:id/impacto", updateImpacto);
router.patch("/:id/conclusiones", updateConclusiones);
router.patch("/:id/autoevaluacion", updateAutoevaluacion);
router.patch("/:id/evaluacion-pares", updateEvaluacionPares);
router.patch("/:id/evaluacion-institucional", updateEvaluacionInstitucional);


export default router;