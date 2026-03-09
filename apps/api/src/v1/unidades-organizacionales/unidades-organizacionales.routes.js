import { Router } from "express";
import { getUnidadesOrganizacionales } from "./unidades-organizacionales.controller.js";

const router = Router();

router.get("/", getUnidadesOrganizacionales);

export default router;