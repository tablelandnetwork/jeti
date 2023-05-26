import { equal, deepEqual, rejects } from "node:assert";
import { test } from "mocha";
import { toString } from "uint8arrays/to-string";
import { getAccounts, getDatabase } from "@tableland/local";
import { Pinner, createProcessor, type RowObject } from "../src/main";
import { TEST_TIMEOUT_FACTOR } from "./setup";
import * as MockIPFS from "mockipfs";

describe("pinContentToIpfs", function () {
  this.timeout(TEST_TIMEOUT_FACTOR * 10000);

  const accounts = getAccounts();
  const db = getDatabase(accounts[1]);
  const mockNode = MockIPFS.getLocal({ debug: false });

  // Start & stop a mock ipfs node to reset state between each test
  beforeEach(async function () {
    await mockNode.start();
  });
  afterEach(async function () {
    await mockNode.stop();
  });

  test("should be able to pin to local", async function () {
    const file = new Uint8Array([21, 31]);
    // setup ipfs mock
    mockNode
      .forPinRemoteLs()
      .thenReturn([
        { service: "foo", endpoint: new URL("http://localhost:54321") },
      ]);
    mockNode.forGet().thenReturn(toString(file));

    // setup table for testing
    const { meta } = await db
      .prepare("create table mytable (id int, file text);")
      .all();
    const tableName = meta.txn?.name ?? "";

    const pinner = new Pinner(mockNode.ipfsOptions, "local");
    const processor = createProcessor(
      pinner.pin.bind(pinner),
      pinner.resolveCid.bind(pinner)
    );
    const query =
      await processor`INSERT INTO ${tableName} (id, file) values (1, '${file}');`;

    // Result: INSERT INTO mytable_31337_1 (id, file) values (id, 'ipfs://bafy...etc');
    // The pinToLocal also pinned the file to your local IPFS node.

    await db.prepare(query).all();
    const { results: resultSet } = await db
      .prepare(`SELECT * FROM ${tableName};`)
      .all<RowObject>();

    // Only attempts to fetch 'file' column from IPFS
    const res = await processor.resolve(resultSet, ["file"]);
    const row1 = res[0];
    const { value: fileValue } = await row1.file.next();

    equal(row1.id, 1);
    deepEqual(fileValue, file);
  });

  test("should be able to pin to remote", async function () {
    const file = new Uint8Array([21, 31]);
    // setup ipfs mock
    mockNode
      .forPinRemoteLs()
      .thenReturn([
        { service: "foo", endpoint: new URL("http://localhost:54321") },
      ]);
    mockNode.forGet().thenReturn(toString(file));

    // setup table for testing
    const { meta } = await db
      .prepare("create table mytable (id int, file text);")
      .all();
    const tableName = meta.txn?.name ?? "";

    // A second arg value other than "local" will result in the processor using a remote service
    const pinner = new Pinner(
      mockNode.ipfsOptions,
      "http://remote.pinning.com"
    );

    const processor = createProcessor(
      pinner.pin.bind(pinner),
      pinner.resolveCid.bind(pinner)
    );
    const query =
      await processor`INSERT INTO ${tableName} (id, file) values (1, '${file}');`;

    await db.prepare(query).all();
    const { results: resultSet } = await db
      .prepare(`SELECT * FROM ${tableName};`)
      .all<RowObject>();

    const res = await processor.resolve(resultSet, ["file"]);
    const row1 = res[0];
    const { value: fileValue } = await row1.file.next();

    equal(row1.id, 1);
    deepEqual(fileValue, file);
  });

  test("should do nothing if content is already pinned to remote", async function () {
    const file = new Uint8Array([21, 31]);
    // setup ipfs mock
    mockNode.forPinRemoteAdd().thenFailWith("DUPLICATE_OBJECT");
    mockNode
      .forPinRemoteLs()
      .thenReturn([
        { service: "foo", endpoint: new URL("http://localhost:54321") },
      ]);
    mockNode.forGet().thenReturn(toString(file));

    // setup table for testing
    const { meta } = await db
      .prepare("create table mytable (id int, file text);")
      .all();
    const tableName = meta.txn?.name ?? "";

    // A second arg value other than "local" will result in the processor using a remote service
    const pinner = new Pinner(
      mockNode.ipfsOptions,
      "http://remote.pinning.com"
    );

    const processor = createProcessor(
      pinner.pin.bind(pinner),
      pinner.resolveCid.bind(pinner)
    );
    const query =
      await processor`INSERT INTO ${tableName} (id, file) values (1, '${file}');`;

    await db.prepare(query).all();
    const { results: resultSet } = await db
      .prepare(`SELECT * FROM ${tableName};`)
      .all<RowObject>();

    const res = await processor.resolve(resultSet, ["file"]);
    const row1 = res[0];
    const { value: fileValue } = await row1.file.next();

    equal(row1.id, 1);
    deepEqual(fileValue, file);
  });

  test("should throw an error if it cannot pin to remote", async function () {
    const file = new Uint8Array([21, 31]);
    // setup ipfs mock
    mockNode.forPinRemoteAdd().thenCloseConnection();
    mockNode
      .forPinRemoteLs()
      .thenReturn([
        { service: "foo", endpoint: new URL("http://localhost:54321") },
      ]);
    mockNode.forGet().thenReturn(toString(file));

    // A second arg value other than "local" will result in the processor using a remote service
    const pinner = new Pinner(
      mockNode.ipfsOptions,
      "http://remote.pinning.com"
    );

    const processor = createProcessor(
      pinner.pin.bind(pinner),
      pinner.resolveCid.bind(pinner)
    );
    const query = processor`INSERT INTO throw_table_31337_1 (id, file) values (1, '${file}');`;
    await rejects(query, {
      message: "fetch failed",
      name: "TypeError",
    });
  });

  test("should throw an error if no remote services are available", async function () {
    const file = new Uint8Array([13, 37]);
    // setup ipfs mock
    mockNode.forPinRemoteLs().thenReturn([]);

    const pinner = new Pinner(mockNode.ipfsOptions, "local");
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
