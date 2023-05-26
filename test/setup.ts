import fetch, { Headers, Request, Response } from "node-fetch";
import { after, before } from "mocha";
import { LocalTableland } from "@tableland/local";

if (!globalThis.fetch) {
  (globalThis as any).fetch = fetch;
  (globalThis as any).Headers = Headers;
  (globalThis as any).Request = Request;
  (globalThis as any).Response = Response;
}

const getTimeoutFactor = function (): number {
  const envFactor = Number(process.env.TEST_TIMEOUT_FACTOR);
  if (!isNaN(envFactor) && envFactor > 0) {
    return envFactor;
  }
  return 1;
};

export const TEST_TIMEOUT_FACTOR = getTimeoutFactor();

const lt = new LocalTableland({
  silent: true,
});

before(async function () {
  this.timeout(TEST_TIMEOUT_FACTOR * 30000);
  await lt.start();
});

after(async function () {
  await lt.shutdown();
});
