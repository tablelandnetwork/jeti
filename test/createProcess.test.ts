import { describe, test } from "mocha";
import { assert } from "sinon";
import { createProcessor, encrypt } from "../src/main";
import fetch, { Headers, Request, Response } from "node-fetch";

if (!globalThis.fetch) {
  (globalThis as any).fetch = fetch;
  (globalThis as any).Headers = Headers;
  (globalThis as any).Request = Request;
  (globalThis as any).Response = Response;
}

describe('prepare', () => {
  

  test("Should create process which converts to and resolves base 64 strings", async () => {



    const b64 = createProcessor((value: string) => {return btoa(value)}, (cell: string | number) => {return atob(cell.toString())})

    const createdStatement = await b64`INSERT INTO table_1_1 (message, recipient) VALUES ('${'Hello World'}', '${'John Doe'}');`;

    assert.match(createdStatement, "INSERT INTO table_1_1 (message, recipient) VALUES ('SGVsbG8gV29ybGQ=', 'Sm9obiBEb2U=');");

    const resultSet = [ 
      { column: "SGVsbG8gV29ybGQ=", otherColumn: "SGVsbG8gV29ybGQ=" },
      { column: "Sm9obiBEb2U=", otherColumn: "Sm9obiBEb2U=" }
    ];

    const resultFromResolver = await b64.resolve(resultSet, ["column"]);

    assert.match(resultFromResolver[0].column, "Hello World");
    assert.match(resultFromResolver[0].otherColumn, "SGVsbG8gV29ybGQ=");
    assert.match(resultFromResolver[1].column, "John Doe");
    assert.match(resultFromResolver[1].otherColumn, "Sm9obiBEb2U=");

  });

  test("Built in encrypt example encrypts and decrypts", async () => {
    const encyptor = encrypt("symetric-secret");

    const createdStatement = await encyptor`INSERT INTO table_31337_1 (message, recipient) VALUES ('${'Hello World'}', '${'John Doe'}');`;
    const [world, john] = createdStatement.matchAll(/U2FsdGVkX[0-9a-zA-Z/+=]+/g);
    assert.match(createdStatement, `INSERT INTO table_31337_1 (message, recipient) VALUES ('${world}', '${john}');`);

    const results = await encyptor.resolve([
      { message: world.toString(), recipient: john.toString() }
    ], ["message", "recipient"]);

    assert.match(results[0].message, "Hello World");
    assert.match(results[0].recipient, "John Doe");

  });

});
