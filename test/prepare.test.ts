import { describe, test } from "mocha";
import { match } from "sinon";

describe('prepare', () => {
  test("should prepare the test", () => {
    match(() => true, "should be true");
  });
});
