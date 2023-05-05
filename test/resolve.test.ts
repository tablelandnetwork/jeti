import { describe, test } from "mocha";
import { assert } from "sinon";
import { setup } from "../src/setup";
import { resolve } from '../src/main';
import { ipfs } from './mocks';
import fetch, { Headers, Request, Response } from "node-fetch";

if (!globalThis.fetch) {
  (globalThis as any).fetch = fetch;
  (globalThis as any).Headers = Headers;
  (globalThis as any).Request = Request;
  (globalThis as any).Response = Response;
}

describe('resolve', () => {

  before(() => {
    setup({
      ipfsClient:ipfs() as any  
    }); 
  });

  test("Should resolve to value", async () => {

    const resultFromResolver = await resolve([ 
        { column: "ipfs://bafy" }
      ], ["column"]);

    assert.match(resultFromResolver[0].column, Uint8Array.from([0, 1, 5]));
  });
});
