import { equal, rejects } from "node:assert";
import { test } from "mocha";
import truncate from "../src/processors/truncate";
import { TEST_TIMEOUT_FACTOR } from "./setup";

describe("truncate", function () {
  this.timeout(TEST_TIMEOUT_FACTOR * 10000);

  test("should be able to truncate a string", async function () {
    const longString = "the quick red fox jumped over the lazy brown dog and will be truncated";

    const truncatedString = await truncate`${longString}`;
    equal(truncatedString, longString.slice(0, 10));
  });

  test("should append message when trying to de-truncate a string", async function () {
    const longString = "the quick red fox jumped over the lazy brown dog and will be truncated";

    const detruncatedString = await truncate.resolve(
      [{ val: `${longString}` }],
      ["val"]
    );
    equal(
      detruncatedString[0].val,
      [
        longString,
        "...",
        "Warning: the original value cannot be retrieved; truncating is lossy.",
      ].join("")
    );
  });

  test("should error on attempt to truncate a non-string", async function () {
    await rejects(truncate`${1}`);
  });
});
