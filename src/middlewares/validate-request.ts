import { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError, ZodType } from "zod";

type RequestSchemas = {
  body?: ZodType;
  params?: ZodType;
  query?: ZodType;
};

function getValidationMessage(error: ZodError): string {
  return error.issues[0]?.message ?? "Invalid request data.";
}

export function validateRequest(schemas: RequestSchemas): RequestHandler {
  return (request: Request, response: Response, next: NextFunction) => {
    if (schemas.body) {
      const parsedBody = schemas.body.safeParse(request.body);

      if (!parsedBody.success) {
        return response.status(400).json({
          message: getValidationMessage(parsedBody.error),
        });
      }

      request.body = parsedBody.data;
    }

    if (schemas.params) {
      const parsedParams = schemas.params.safeParse(request.params);

      if (!parsedParams.success) {
        return response.status(400).json({
          message: getValidationMessage(parsedParams.error),
        });
      }

      request.params = parsedParams.data as Request["params"];
    }

    if (schemas.query) {
      const parsedQuery = schemas.query.safeParse(request.query);

      if (!parsedQuery.success) {
        return response.status(400).json({
          message: getValidationMessage(parsedQuery.error),
        });
      }

      request.query = parsedQuery.data as Request["query"];
    }

    return next();
  };
}
