import { z } from "zod";

const championshipTypes = ["elimination rounds", "league", "mixed", "groups"] as const;

const emptyStringToUndefined = (value: unknown): unknown =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const requiredString = (fieldName: string) =>
  z
    .string({
      error: (issue) =>
        issue.input === undefined ? `${fieldName} is required.` : `${fieldName} must be a string.`,
    })
    .trim()
    .min(1, `${fieldName} is required.`);

const requiredPositiveInteger = (fieldName: string) =>
  z.preprocess(
    emptyStringToUndefined,
    z
      .coerce.number({
        error: (issue) =>
          issue.input === undefined
            ? `${fieldName} is required.`
            : `${fieldName} must be a positive integer.`,
      })
      .int(`${fieldName} must be a positive integer.`)
      .positive(`${fieldName} must be a positive integer.`),
  );

const clubsSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined ? "clubs is required." : "clubs must be a valid JSON array.",
  })
  .trim()
  .min(1, "clubs is required.")
  .transform((value, context) => {
    try {
      const parsedValue = JSON.parse(value) as unknown;

      if (!Array.isArray(parsedValue)) {
        context.addIssue({
          code: "custom",
          message: "clubs must be a valid JSON array.",
        });

        return z.NEVER;
      }

      return parsedValue;
    } catch {
      context.addIssue({
        code: "custom",
        message: "clubs must be a valid JSON array.",
      });

      return z.NEVER;
    }
  })
  .pipe(
    z
      .array(z.string().trim().min(1, "clubs must contain valid club ids."))
      .min(1, "clubs must be a non-empty array."),
  );

export const createChampionshipBodySchema = z
  .object({
    name: requiredString("name"),
    type: z.enum(championshipTypes, {
      error: "type must be one of: elimination rounds, league, mixed, groups.",
    }),
    weight: z.preprocess(
      emptyStringToUndefined,
      z
        .coerce.number({
          error: (issue) =>
            issue.input === undefined
              ? "weight is required."
              : "weight must be an integer between 1 and 10.",
        })
        .int("weight must be an integer between 1 and 10.")
        .min(1, "weight must be an integer between 1 and 10.")
        .max(10, "weight must be an integer between 1 and 10."),
    ),
    clubsCount: requiredPositiveInteger("clubsCount"),
    relegation: z.preprocess(
      emptyStringToUndefined,
      z
        .coerce.number({
          error: (issue) =>
            issue.input === undefined
              ? "relegation is required."
              : "relegation must be an integer between 0 and 8.",
        })
        .int("relegation must be an integer between 0 and 8.")
        .min(0, "relegation must be an integer between 0 and 8.")
        .max(8, "relegation must be an integer between 0 and 8."),
    ),
    clubs: clubsSchema,
  })
  .refine((payload) => payload.clubs.length === payload.clubsCount, {
    message: "clubs length must be equal to clubsCount.",
    path: ["clubs"],
  });

export const getChampionshipByIdParamsSchema = z.object({
  id: requiredString("id").regex(/^[1-9]\d*$/, "id must be a positive integer."),
});

export const getAllChampionshipsQuerySchema = z.object({
  name: z.preprocess(
    emptyStringToUndefined,
    z
      .string({
        error: "name must be a string.",
      })
      .trim()
      .min(1, "name is required.")
      .optional(),
  ),
});

const optionalRelegation = z.preprocess(
  emptyStringToUndefined,
  z
    .coerce.number({
      error: "relegation must be an integer between 0 and 8.",
    })
    .int("relegation must be an integer between 0 and 8.")
    .min(0, "relegation must be an integer between 0 and 8.")
    .max(8, "relegation must be an integer between 0 and 8.")
    .optional(),
);

export const updateChampionshipBodySchema = z.object({
  name: requiredString("name"),
  weight: z.preprocess(
    emptyStringToUndefined,
    z
      .coerce.number({
        error: (issue) =>
          issue.input === undefined
            ? "weight is required."
            : "weight must be an integer between 1 and 10.",
      })
      .int("weight must be an integer between 1 and 10.")
      .min(1, "weight must be an integer between 1 and 10.")
      .max(10, "weight must be an integer between 1 and 10."),
  ),
  relegation: optionalRelegation,
});

export const updateChampionshipParamsSchema = z.object({
  id: requiredString("id").regex(/^[1-9]\d*$/, "id must be a positive integer."),
});

export const finishChampionshipBodySchema = z.object({
  championshipId: requiredPositiveInteger("championshipId"),
  clubId: requiredString("clubId"),
});
