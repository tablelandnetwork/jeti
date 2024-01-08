import { equal, rejects } from "node:assert";
import { test } from "mocha";
import { truncate } from "../src/main";
import { TEST_TIMEOUT_FACTOR } from "./setup";

describe("truncate", function () {
  this.timeout(TEST_TIMEOUT_FACTOR * 10000);
  const longString = new Array(1026).join("a"); // String of 1025 bytes—one more than 1kb limit

  test("should not truncate a string 1024 bytes or less", async function () {
    const normalString = new Array(1025).join("a");
    const truncatedString = await truncate`${normalString}`;
    equal(truncatedString, normalString);
  });

  test("should be able to truncate a string", async function () {
    const truncatedString = await truncate`${longString}`;
    equal(truncatedString, longString.slice(0, 1024));
  });

  test("should append ellipses when detruncate a string", async function () {
    const truncatedString = await truncate`${longString}`;
    const detruncatedString = await truncate.resolve(
      [{ val: `${truncatedString}` }],
      ["val"]
    );
    equal(
      detruncatedString[0].val,
      [truncatedString.slice(0, 1024), "..."].join("")
    );
  });

  test("should error on attempt to truncate a non-string", async function () {
    await rejects(truncate`${1}`);
  });
});
