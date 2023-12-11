import { equal, rejects, strictEqual } from "node:assert";
import { readFile } from "node:fs";
import { test } from "mocha";
import { getAccounts, getDatabase } from "@tableland/local";
import {
  skip,
  Pinner,
  createProcessor,
  pinToLocal,
  pinToProvider,
} from "../src/main";
import { TEST_TIMEOUT_FACTOR } from "./setup";
import * as MockIPFS from "mockipfs";
import { temporaryWrite } from "tempy";

describe("pinContentToIpfs", function () {
  this.timeout(TEST_TIMEOUT_FACTOR * 10000);

  const accounts = getAccounts();
  const db = getDatabase(accounts[1]);
  const mockNode = MockIPFS.getLocal({ debug: false });
  const contentString = "Hello world"; // Same value-to-CID for all tests

  // Start & stop a mock ipfs node to reset state between each test
  beforeEach(async function () {
    await mockNode.start();
    // All strings and buffers are converted to utf8 with a value "Hello world"
    mockNode.forCat().thenReturn(contentString);
  });
  afterEach(async function () {
    await mockNode.stop();
  });

  test("should be to use pinToLocal", async function () {
    // Set up ipfs mock
    const url = "http://localhost:54321";
    mockNode
      .forPinRemoteLs()
      .thenReturn([{ service: "foo", endpoint: new URL(url) }]);

    const localPin = pinToLocal({ url });
    strictEqual(typeof localPin, "function");
    strictEqual(typeof localPin.resolve, "function");
    strictEqual(
      localPin.resolve.length,
      2,
      "Expected 'resolve' method to have 2 parameters"
    );
  });

  test("should be to use pinToProvider", async function () {
    // Set up ipfs mock
    const url = "http://localhost:54321";
    mockNode
      .forPinRemoteLs()
      .thenReturn([{ service: "foo", endpoint: new URL(url) }]);

    const remotePin = pinToProvider({ url });
    strictEqual(typeof remotePin, "function");
    strictEqual(typeof remotePin.resolve, "function");
    strictEqual(
      remotePin.resolve.length,
      2,
      "Expected 'resolve' method to have 2 parameters"
    );
  });

  test("should be able to pin string to local", async function () {
    const file = "Hello world";
    // Set up ipfs mock
    mockNode.forPinAdd().thenPinSuccessfully();

    // Set up table for testing
    const { meta } = await db
      .prepare("create table my_table (id int, file text);")
      .all();
    const tableName = meta.txn?.name ?? "";

    // Set up processor for pinning & templating SQL string
    const pinner = new Pinner(mockNode.ipfsOptions, "local");
    const processor = createProcessor(
      pinner.pin.bind(pinner),
      pinner.resolveCid.bind(pinner)
    );

    // Write data with the CID
    const query = await processor`INSERT INTO ${skip(
      tableName
    )} (id, file) values (1, '${file}');`;
    // Result: INSERT INTO my_table_31337_2 (id, file) values (1, 'bafy...');
    const { meta: write } = await db.prepare(query).all();
    await write.txn?.wait();

    // Get raw results with CID
    const { results } = await db
      .prepare(`SELECT * FROM ${tableName};`)
      .all<{ id: number; file: string }>();

    // Fetch 'file' column from IPFS, resolving the CID as utf8
    const res = await processor.resolve(results, ["file"]);
    const row1 = res[0];

    equal(row1.id, 1);
    equal(row1.file, file);
  });

  test("should be able to pin uint8array to local", async function () {
    // Represents a file with the contents "Hello world"
    const file = new Uint8Array([
      72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100,
    ]);
    // Set up ipfs mock
    mockNode.forPinAdd().thenPinSuccessfully();

    // Set up table for testing
    const { meta } = await db
      .prepare("create table my_table (id int, file text);")
      .all();
    const tableName = meta.txn?.name ?? "";

    // Set up processor for pinning & templating SQL string
    const pinner = new Pinner(mockNode.ipfsOptions, "local");
    const processor = createProcessor(
      pinner.pin.bind(pinner),
      pinner.resolveCid.bind(pinner)
    );

    // Write data with the CID
    const query = await processor`INSERT INTO ${skip(
      tableName
    )} (id, file) values (1, '${file}');`;
    // Result: INSERT INTO my_table_31337_2 (id, file) values (1, 'bafy...');
    const { meta: write } = await db.prepare(query).all();
    await write.txn?.wait();

    // Get raw results with CID
    const { results: resultSet } = await db
      .prepare(`SELECT * FROM ${tableName};`)
      .all<{ id: number; file: string }>();

    // Fetch 'file' column from IPFS, resolving the CID as utf8
    const res = await processor.resolve(resultSet, ["file"]);
    const row1 = res[0];

    equal(row1.id, 1);
    equal(row1.file, contentString);
  });

  test("should be able to pin file converted to uint8array to local", async function () {
    // Represents a file with the contents "Hello world"
    const filePath = await temporaryWrite("Hello world");
    const fileAsArr = () => {
      return new Promise((resolve, reject) => {
        readFile(filePath, (err, data) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(new Uint8Array(data));
        });
      });
    };
    const file = await fileAsArr();

    // Set up ipfs mock
    mockNode.forPinAdd().thenPinSuccessfully();

    // Set up table for testing
    const { meta } = await db
      .prepare("create table my_table (id int, file text);")
      .all();
    const tableName = meta.txn?.name ?? "";

    // Set up processor for pinning & templating SQL string
    const pinner = new Pinner(mockNode.ipfsOptions, "local");
    const processor = createProcessor(
      pinner.pin.bind(pinner),
      pinner.resolveCid.bind(pinner)
    );

    // Write data with the CID
    const query = await processor`INSERT INTO ${skip(
      tableName
    )} (id, file) values (1, '${file}');`;
    // Result: INSERT INTO my_table_31337_2 (id, file) values (1, 'bafy...');
    const { meta: write } = await db.prepare(query).all();
    await write.txn?.wait();

    // Get raw results with CID
    const { results: resultSet } = await db
      .prepare(`SELECT * FROM ${tableName};`)
      .all<{ id: number; file: string }>();

    // Fetch 'file' column from IPFS, resolving the CID as utf8
    const res = await processor.resolve(resultSet, ["file"]);
    const row1 = res[0];

    equal(row1.id, 1);
    equal(row1.file, contentString);
  });

  test("should be able to pin to remote", async function () {
    const file = new Uint8Array([
      72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100,
    ]);
    // Set up ipfs mock
    mockNode.forPinRemoteAdd().thenPinSuccessfully();
    mockNode
      .forPinRemoteLs()
      .thenReturn([
        { service: "foo", endpoint: new URL("http://localhost:54321") },
      ]);

    // Set up table for testing
    const { meta } = await db
      .prepare("create table my_table (id int, file text);")
      .all();
    const tableName = meta.txn?.name ?? "";

    // Set up processor for remote pinning at a provider & templating SQL string
    const pinner = new Pinner(mockNode.ipfsOptions, "provider");
    const processor = createProcessor(
      pinner.pin.bind(pinner),
      pinner.resolveCid.bind(pinner)
    );

    // Write data with the CID
    const query = await processor`INSERT INTO ${skip(
      tableName
    )} (id, file) values (1, '${file}');`;
    const { meta: write } = await db.prepare(query).all();
    await write.txn?.wait();

    // Get raw results with CID
    const { results: resultSet } = await db
      .prepare(`SELECT * FROM ${tableName};`)
      .all<{ id: number; file: string }>();

    // Fetch 'file' column from IPFS, resolving the CID as utf8
    const res = await processor.resolve(resultSet, ["file"]);
    const row1 = res[0];

    equal(row1.id, 1);
    equal(row1.file, contentString);
  });

  test("should not pin if content is already pinned but still execute query", async function () {
    const file = new Uint8Array([
      72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100,
    ]);
    // Set up ipfs mock
    mockNode.forPinRemoteAdd().thenFailWith("DUPLICATE_OBJECT");
    mockNode
      .forPinRemoteLs()
      .thenReturn([
        { service: "foo", endpoint: new URL("http://localhost:54321") },
      ]);

    // Set up table for testing
    const { meta } = await db
      .prepare("create table my_table (id int, file text);")
      .all();
    const tableName = meta.txn?.name ?? "";

    // Set up processor for remote pinning at a provider & templating SQL string
    const pinner = new Pinner(mockNode.ipfsOptions, "provider");
    const processor = createProcessor(
      pinner.pin.bind(pinner),
      pinner.resolveCid.bind(pinner)
    );

    // Write data with the CID
    const query = await processor`INSERT INTO ${skip(
      tableName
    )} (id, file) values (1, '${file}');`;
    const { meta: write } = await db.prepare(query).all();
    await write.txn?.wait();

    // Get raw results with CID
    const { results: resultSet } = await db
      .prepare(`SELECT * FROM ${tableName};`)
      .all<{ id: number; file: string }>();

    // Fetch 'file' column from IPFS, resolving the CID as utf8
    const res = await processor.resolve(resultSet, ["file"]);
    const row1 = res[0];

    equal(row1.id, 1);
    equal(row1.file, contentString);
  });

  test("should throw if value is empty or undefined", async function () {
    let file: string | undefined | Uint8Array = "";
    // Set up ipfs mock
    mockNode.forPinAdd().thenCloseConnection();

    // Set up processor for pinning & templating SQL string
    const pinner = new Pinner(mockNode.ipfsOptions, "local");
    const processor = createProcessor(
      pinner.pin.bind(pinner),
      pinner.resolveCid.bind(pinner)
    );

    // Try to write empty string
    const query = processor`INSERT INTO my_table_31337_2 (id, file) values (1, '${file}');`;
    await rejects(query, {
      name: "Error",
      message: "Content is empty or undefined; no CID created.",
    });

    // Try to write undefined
    file = undefined;
    await rejects(query, {
      name: "Error",
      message: "Content is empty or undefined; no CID created.",
    });

    // Try to write empty Uint8Array
    file = new Uint8Array();
    await rejects(query, {
      name: "Error",
      message: "Content is empty or undefined; no CID created.",
    });
  });

  test("should throw if it cannot pin to remote", async function () {
    const file = new Uint8Array([
      72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100,
    ]);
    // Set up ipfs mock
    mockNode.forPinRemoteAdd().thenCloseConnection();
    mockNode
      .forPinRemoteLs()
      .thenReturn([
        { service: "foo", endpoint: new URL("http://localhost:54321") },
      ]);

    // Set up processor for remote pinning at a provider & templating SQL string
    const pinner = new Pinner(mockNode.ipfsOptions, "provider");
    const processor = createProcessor(
      pinner.pin.bind(pinner),
      pinner.resolveCid.bind(pinner)
    );

    // Try to set up a SQL string, but fail because we can't pin to remote
    const query = processor`INSERT INTO throw_table_31337_1 (id, file) values (1, '${file}');`;
    await rejects(query, {
      message: "fetch failed",
      name: "TypeError",
    });
  });

  test("should throw if no remote services are available", async function () {
    const file = new Uint8Array([
      72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100,
    ]);
    // Set up ipfs mock
    mockNode.forPinRemoteLs().thenReturn([]);

    // Set up processor for remote pinning at a non-existent provider
    const pinner = new Pinner(mockNode.ipfsOptions, "provider");
    const processor = createProcessor(
      pinner.pin.bind(pinner),
      pinner.resolveCid.bind(pinner)
    );
    const query = processor`INSERT INTO no_remote_31337_1 (id, file) values (1, '${file}');`;

    await rejects(query, {
      name: "Error",
      message: "No remote pinning service connected.",
    });
  });
});
