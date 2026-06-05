import { z } from "zod";

const requiredString = (fieldName: string) =>
  z
    .string({
      error: (issue) =>
        issue.input === undefined ? `${fieldName} is required.` : `${fieldName} must be a string.`,
    })
    .trim()
    .min(1, `${fieldName} is required.`);

const requiredPositiveInteger = (fieldName: string) =>
  z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? `${fieldName} is required.`
          : `${fieldName} must be a positive integer.`,
    })
    .int(`${fieldName} must be a positive integer.`)
    .positive(`${fieldName} must be a positive integer.`);

export const createRoundBodySchema = z
  .object({
    championshipId: requiredPositiveInteger("championshipId"),
  identifier: requiredString("identifier").optional(),
    homeTeamId: requiredString("homeTeamId"),
    visitTeamId: requiredString("visitTeamId"),
    homeGoals: z
      .number({
        error: (issue) =>
          issue.input === undefined
            ? "homeGoals is required."
            : "homeGoals must be a non-negative integer.",
      })
      .int("homeGoals must be a non-negative integer.")
      .min(0, "homeGoals must be a non-negative integer."),
    visitGoals: z
      .number({
        error: (issue) =>
          issue.input === undefined
            ? "visitGoals is required."
            : "visitGoals must be a non-negative integer.",
      })
      .int("visitGoals must be a non-negative integer.")
      .min(0, "visitGoals must be a non-negative integer."),
    date: z.iso.datetime({
      error: (issue) =>
        issue.input === undefined ? "date is required." : "date must be a valid ISO datetime.",
    }),
    phase: requiredString("phase"),
  })
  .refine((payload) => payload.homeTeamId !== payload.visitTeamId, {
    message: "homeTeamId and visitTeamId must be different.",
    path: ["visitTeamId"],
  });

export const updateRoundParamsSchema = z.object({
  id: requiredString("id").regex(/^[1-9]\d*$/, "id must be a positive integer."),
});

export const updateRoundBodySchema = z
  .object({
    identifier: requiredString("identifier").optional(),
    homeTeamId: requiredString("homeTeamId").optional(),
    visitTeamId: requiredString("visitTeamId").optional(),
    homeGoals: z
      .number({
        error: (issue) =>
          issue.input === undefined
            ? "homeGoals is required."
            : "homeGoals must be a non-negative integer.",
      })
      .int("homeGoals must be a non-negative integer.")
      .min(0, "homeGoals must be a non-negative integer.")
      .optional(),
    visitGoals: z
      .number({
        error: (issue) =>
          issue.input === undefined
            ? "visitGoals is required."
            : "visitGoals must be a non-negative integer.",
      })
      .int("visitGoals must be a non-negative integer.")
      .min(0, "visitGoals must be a non-negative integer.")
      .optional(),
    date: z
      .iso.datetime({
        error: (issue) =>
          issue.input === undefined ? "date is required." : "date must be a valid ISO datetime.",
      })
      .optional(),
    phase: requiredString("phase").optional(),
  })
  .refine(
    (payload) => {
      if (payload.homeTeamId && payload.visitTeamId) {
        return payload.homeTeamId !== payload.visitTeamId;
      }
      return true;
    },
    {
      message: "homeTeamId and visitTeamId must be different.",
      path: ["visitTeamId"],
    },
  );

export const listRoundsByFilterParamsSchema = z.object({
  championshipId: requiredString("championshipId").regex(
    /^[1-9]\d*$/,
    "championshipId must be a positive integer.",
  ),
});

export const listRoundsByFilterQuerySchema = z.object({
  identifier: requiredString("identifier").optional(),
  phase: requiredString("phase").optional(),
});
