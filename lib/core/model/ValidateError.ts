export interface ValidateError {
  message: "Validation failed";
  details: { [name: string]: unknown };
}