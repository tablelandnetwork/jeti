import createProcessor from "../processor";

async function truncate(value: string) {
  if (typeof value !== "string") {
    throw new Error("Invalid type: can only truncate strings.");
  }
  return value.slice(0, 10);
}

async function detruncate(value: string) {
  return (
    value +
    "..." +
    "Warning: the original value cannot be retrieved; truncating is lossy."
  );
}

export default createProcessor(truncate, detruncate);
