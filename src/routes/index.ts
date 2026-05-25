import { Router } from "express";

import championshipRoutes from "./championship.route";
import clubRoutes from "./club.route";
import roundRoutes from "./round.route";

const router = Router();

router.get("/health", (_request, response) => {
  return response.status(200).send("API PING - ONLINE");
});

router.use("/clubs", clubRoutes);
router.use("/championships", championshipRoutes);
router.use("/rounds", roundRoutes);

export default router;
