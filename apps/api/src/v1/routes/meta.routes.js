import { Router } from "express";
import { health, version, getAlineaciones } from "../controllers/meta.controller.js";

const router = Router();

router.get("/health", health);
router.get("/version", version);
router.get("/alineaciones", getAlineaciones);

export default router;