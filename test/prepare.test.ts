import { describe, test } from "mocha";
import { assert } from "sinon";
import { setup } from "../src/setup";
import { prepare } from '../src/main';
import { ipfs } from './mocks';
import fetch, { Headers, Request, Response } from "node-fetch";

if (!globalThis.fetch) {
  (globalThis as any).fetch = fetch;
  (globalThis as any).Headers = Headers;
  (globalThis as any).Request = Request;
  (globalThis as any).Response = Response;
}

describe('prepare', () => {

  before(() => {
    setup({
      ipfsClient: ipfs() as any,
      pin: async (content) => {
        console.log(content)
        return {
          cid: "ipfs://bafy",
          pinned: true
        }
      }
    }); 
  });

  test("should prepare the test", async () => {

    const createdStatement = await prepare`INSERT INTO table (column) VALUES ('${Uint8Array.from([0])}');`;

    assert.match(createdStatement, "INSERT INTO table (column) VALUES ('ipfs://bafy');");
  });

});
