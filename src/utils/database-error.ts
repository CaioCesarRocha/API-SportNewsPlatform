interface DatabaseError {
  code?: string;
  constraint?: string;
  detail?: string;
  message?: string;
  cause?: DatabaseError;
}

function walkError(error: unknown, key: keyof DatabaseError): string | null {
  if (!error || typeof error !== "object") return null;

  const dbError = error as DatabaseError;

  const value = dbError[key];
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  if (dbError.cause) return walkError(dbError.cause, key);

  return null;
}

export function isUniqueConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  return walkError(error, "code") === "23505";
}

const CONSTRAINT_FIELD_MAP: Record<string, string> = {
  clubs_name_idx: "Name",
  clubs_slug_idx: "Slug",
  clubs_public_id_idx: "Public id",
  championships_name_idx: "Name",
  club_titles_club_championship_idx: "Club title",
};

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function formatFieldName(field: string): string {
  const inner = field.match(/\(([\w:]+)\)/);
  const columnName = inner ? inner[1].replace(/::\w+/g, "") : field;
  return capitalize(columnName.replace(/_/g, " "));
}

function parseDetail(detail: string): { field: string; value: string } | null {
  const match = detail.match(
    /Key \((\w+(?:\([^)]*\))?)\)=\(([^)]*)\) already exists\./,
  );
  if (match) {
    return { field: match[1], value: match[2] };
  }

  return null;
}

export function createUniqueConstraintErrorResponse(error: unknown): {
  status: number;
  body: { message: string };
} | null {
  if (!isUniqueConstraintError(error)) return null;

  const detail = walkError(error, "detail");

  if (detail) {
    const parsed = parseDetail(detail);
    if (parsed) {
      const fieldName = formatFieldName(parsed.field);

      return {
        status: 409,
        body: {
          message: `${fieldName} '${parsed.value}' already been used`,
        },
      };
    }

    return {
      status: 409,
      body: {
        message: detail,
      },
    };
  }

  const constraint = walkError(error, "constraint");

  if (constraint && CONSTRAINT_FIELD_MAP[constraint]) {
    return {
      status: 409,
      body: {
        message: `${CONSTRAINT_FIELD_MAP[constraint]} already been used`,
      },
    };
  }

  return {
    status: 409,
    body: {
      message: "A record with this value already exists.",
    },
  };
}
