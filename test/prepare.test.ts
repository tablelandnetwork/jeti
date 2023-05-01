import { describe, test } from "mocha";
import { assert } from "sinon";
import { optionalSetup } from "../src/ipfs-http-client-setup.js";
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
    optionalSetup(ipfs() as any); 
  });

  test("should prepare the test", async () => {

    const createdStatement = await prepare`INSERT INTO table (column) VALUES ('${Uint8Array.from([0])}');`;

    assert.match(createdStatement, "INSERT INTO table (column) VALUES ('ipfs://bafy');");
  });

});
