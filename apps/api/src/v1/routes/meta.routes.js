import { Router } from "express";
import { health, version, getAlineaciones,
  getModeloEducativoElementos,
  getPlanMexicoSectores,
  getOds, } from "../controllers/meta.controller.js";

const router = Router();

router.get("/health", health);
router.get("/version", version);
router.get("/alineaciones", getAlineaciones);
router.get("/modelo-educativo-elementos", getModeloEducativoElementos);
router.get("/plan-mexico-sectores", getPlanMexicoSectores);
router.get("/ods", getOds);

export default router;