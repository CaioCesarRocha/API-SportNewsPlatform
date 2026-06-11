import { Router } from "express";

import { ClubController } from "../controllers/club.controller";
import { requireUploadedFile, uploadImageField } from "../middlewares/upload-image";
import { validateRequest } from "../middlewares/validate-request";
import { ImageStorageService } from "../services/image-storage.service";
import {
  checkClubUniquenessQuerySchema,
  createClubBodySchema,
  getClubsByLocationParamsSchema,
  updateClubParamsSchema,
} from "./club.schema";
import { ClubService } from "../services/club.service";

const router = Router();
const clubService = new ClubService();
const imageStorageService = new ImageStorageService();
const clubController = new ClubController(clubService, imageStorageService);

router.post(
  "/",
  uploadImageField("shield"),
  requireUploadedFile("shield"),
  validateRequest({ body: createClubBodySchema }),
  clubController.createClub,
);

router.put(
  "/:id",
  uploadImageField("shield"),
  validateRequest({ body: createClubBodySchema, params: updateClubParamsSchema }),
  clubController.updateClub,
);

router.get(
  "/location/:country/:state",
  validateRequest({ params: getClubsByLocationParamsSchema }),
  clubController.getClubsByLocation,
);
router.get("/", clubController.getAllClubs);

router.get(
  "/check-uniqueness",
  validateRequest({ query: checkClubUniquenessQuerySchema }),
  clubController.checkUniqueness,
);

export default router;
