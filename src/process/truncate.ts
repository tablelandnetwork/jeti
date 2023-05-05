import createProcess from "../process";

async function truncate(value: string) {
  if(typeof(value)!=="string") {
    throw new Error("Can't truncate things that aren't strings");
  }
  return value.slice(0, 10);
}

async function detruncate(value: string) {
  return value + "..." + "Yo, truncating is lossy, so you can't get the original back.";
}

export default createProcess(truncate, detruncate);

