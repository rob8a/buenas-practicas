import { Router } from "express";
import {
  createBuenaPractica,
  getBuenasPracticas,
  getBuenaPracticaById,
  updateDatosGenerales,
  updateContextoProposito,
  updateFundamentacion,
  updateMetodologia,
  updateFoda,
  updateParticipacion,
  updateEvaluacion,
  updateImpacto,
  updateConclusiones,
} from "./buenas-practicas.controller.js";

const router = Router();

router.post("/", createBuenaPractica);
router.get("/", getBuenasPracticas);
router.get("/:id", getBuenaPracticaById);
router.patch("/:id/datos-generales", updateDatosGenerales);
router.patch("/:id/contexto-proposito", updateContextoProposito);
router.patch("/:id/fundamentacion", updateFundamentacion);
router.patch("/:id/metodologia", updateMetodologia);
router.patch("/:id/foda", updateFoda);
router.patch("/:id/participacion", updateParticipacion);
router.patch("/:id/evaluacion", updateEvaluacion);
router.patch("/:id/impacto", updateImpacto);
router.patch("/:id/conclusiones", updateConclusiones);

export default router;