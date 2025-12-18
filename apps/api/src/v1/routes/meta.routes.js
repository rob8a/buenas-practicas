import { Router } from "express";
import { health, version } from "../controllers/meta.controller.js";

const router = Router();

router.get("/health", health);
router.get("/version", version);

export default router;