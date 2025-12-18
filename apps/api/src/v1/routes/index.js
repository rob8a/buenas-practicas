import { Router } from "express";
import metaRoutes from "./meta.routes.js";

const router = Router();

router.use("/", metaRoutes);

export default router;