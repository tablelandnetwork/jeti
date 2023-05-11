import { describe, test } from "mocha";
import { assert } from "sinon";
import { createProcess } from "../src/main";
import fetch, { Headers, Request, Response } from "node-fetch";

if (!globalThis.fetch) {
  (globalThis as any).fetch = fetch;
  (globalThis as any).Headers = Headers;
  (globalThis as any).Request = Request;
  (globalThis as any).Response = Response;
}

describe('prepare', () => {
  

  test("Should create process which converts to and resolves base 64 strings", async () => {



    const b64 = createProcess((value: string) => {return btoa(value)}, (cell: string | number) => {return atob(cell.toString())})

    const createdStatement = await b64`INSERT INTO table (message, recipient) VALUES ('${'Hello World'}', '${'John Doe'}');`;

    assert.match(createdStatement, "INSERT INTO table (message, recipient) VALUES ('SGVsbG8gV29ybGQ=', 'Sm9obiBEb2U=');");

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

});
