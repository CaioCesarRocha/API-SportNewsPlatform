import { z } from "zod";

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

export const createClubBodySchema = z.object({
  name: requiredString("name"),
  country: requiredString("country"),
  state: z.preprocess(
    emptyStringToUndefined,
    z.string({ error: "state must be a string." }).trim().optional(),
  ),
  stadium: requiredString("stadium"),
});

export const getClubsByLocationParamsSchema = z.object({
  country: requiredString("country route param"),
  state: requiredString("state route param"),
});

export const updateClubParamsSchema = z.object({
  id: requiredString("id route param"),
});
