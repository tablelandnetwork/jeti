import { after, before } from "mocha";
import { LocalTableland } from "@tableland/local";

const getTimeoutFactor = function (): number {
  const envFactor = Number(process.env.TEST_TIMEOUT_FACTOR);
  if (!isNaN(envFactor) && envFactor > 0) {
    return envFactor;
  }
  return 1;
};

export const TEST_TIMEOUT_FACTOR = getTimeoutFactor();

// show logs
const lt = new LocalTableland({
  silent: false,
});

before(async function () {
  this.timeout(TEST_TIMEOUT_FACTOR * 30000);
  await lt.start();
  await new Promise(function (resolve) {
    setTimeout(resolve, TEST_TIMEOUT_FACTOR * 1000);
  });
});

after(async function () {
  await lt.shutdown();
});
