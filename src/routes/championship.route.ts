import { Router } from "express";

import { ChampionshipController } from "../controllers/championship.controller";
import { requireUploadedFile, uploadImageField } from "../middlewares/upload-image";
import { validateRequest } from "../middlewares/validate-request";
import { ImageStorageService } from "../services/image-storage.service";
import {
  createChampionshipBodySchema,
  finishChampionshipBodySchema,
  getAllChampionshipsQuerySchema,
  getChampionshipByIdParamsSchema,
  updateChampionshipBodySchema,
  updateChampionshipParamsSchema,
} from "./championship.schema";
import { ChampionshipService } from "../services/championship.service";

const router = Router();
const championshipService = new ChampionshipService();
const imageStorageService = new ImageStorageService();
const championshipController = new ChampionshipController(
  championshipService,
  imageStorageService,
);

router.post(
  "/finish",
  validateRequest({ body: finishChampionshipBodySchema }),
  championshipController.finishChampionship,
);

router.post(
  "/",
  uploadImageField("emblem"),
  requireUploadedFile("emblem"),
  validateRequest({ body: createChampionshipBodySchema }),
  championshipController.createChampionship,
);

router.put(
  "/:id",
  uploadImageField("emblem"),
  validateRequest({ body: updateChampionshipBodySchema, params: updateChampionshipParamsSchema }),
  championshipController.updateChampionship,
);
router.get(
  "/:id",
  validateRequest({ params: getChampionshipByIdParamsSchema }),
  championshipController.getChampionshipById,
);
router.get(
  "/",
  validateRequest({ query: getAllChampionshipsQuerySchema }),
  championshipController.getAllChampionships,
);

export default router;
