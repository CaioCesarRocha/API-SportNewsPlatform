import { Router } from "express";

import { RoundController } from "../controllers/round.controller";
import { validateRequest } from "../middlewares/validate-request";
import { RoundService } from "../services/round.service";
import { createRoundBodySchema, listRoundsByFilterParamsSchema, listRoundsByFilterQuerySchema, updateRoundBodySchema, updateRoundParamsSchema } from "./round.schema";

const router = Router();
const roundService = new RoundService();
const roundController = new RoundController(roundService);

router.post("/", validateRequest({ body: createRoundBodySchema }), roundController.createRound);
router.put(
  "/:id",
  validateRequest({ body: updateRoundBodySchema, params: updateRoundParamsSchema }),
  roundController.updateRound,
);
router.get(
  "/:championshipId",
  validateRequest({
    params: listRoundsByFilterParamsSchema,
    query: listRoundsByFilterQuerySchema,
  }),
  roundController.listRoundsByFilter,
);

export default router;
