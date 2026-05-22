import { Router } from "express";

import { ChampionshipController } from "../controllers/championship.controller";
import { requireUploadedFile, uploadImageField } from "../middlewares/upload-image";
import { validateRequest } from "../middlewares/validate-request";
import { ImageStorageService } from "../services/image-storage.service";
import {
  createChampionshipBodySchema,
  getAllChampionshipsQuerySchema,
  getChampionshipByIdParamsSchema,
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
  "/",
  uploadImageField("emblem"),
  requireUploadedFile("emblem"),
  validateRequest({ body: createChampionshipBodySchema }),
  championshipController.createChampionship,
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
