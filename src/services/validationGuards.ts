export function optionalString(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

export function isIsoDateTimeString(value: unknown): value is string {
  return typeof value === "string" && Number.isNaN(Date.parse(value)) === false;
}

export function optionalIsoDateTimeString(value: unknown): value is string | undefined {
  return value === undefined || isIsoDateTimeString(value);
}
