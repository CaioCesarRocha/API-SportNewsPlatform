import { Router } from "express";

import { RoundController } from "../controllers/round.controller";
import { validateRequest } from "../middlewares/validate-request";
import { RoundService } from "../services/round.service";
import { createRoundBodySchema, listRoundsByFilterParamsSchema } from "./round.schema";

const router = Router();
const roundService = new RoundService();
const roundController = new RoundController(roundService);

router.post("/", validateRequest({ body: createRoundBodySchema }), roundController.createRound);
router.get(
  "/:championshipId/:identifier",
  validateRequest({ params: listRoundsByFilterParamsSchema }),
  roundController.listRoundsByFilter,
);

export default router;
