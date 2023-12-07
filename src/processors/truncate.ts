import { createProcessor } from "../processor";

/**
 * Creates a function that truncates and detruncates content, used in a SQL
 * statements to avoid max 1024 bytes length.
 * @param value A string to truncate.
 * @returns
 */
function truncate(value: string): string {
  if (typeof value !== "string") {
    throw new Error("Invalid type: can only truncate strings.");
  }
  return value.slice(0, 1025);
}

/**
 * Creates a function that detruncates content, used in a SQL statements to
 * avoid max 1024 bytes length. This function is lossy, as the original value is
 * not retrievable.
 * @param value A string to detruncate.
 * @returns The detruncated string, up until the loss occurs, plus an ellipses.
 */
function detruncate(value: string): string {
  return value + "...";
}

export default createProcessor(truncate, detruncate);
