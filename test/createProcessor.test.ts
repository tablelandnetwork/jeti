import { equal, rejects } from "node:assert/strict";
import { Buffer } from "buffer";
import { describe, test } from "mocha";
import { assert } from "sinon";
import { createProcessor, symmetricEncrypt, skip } from "../src/main";

describe("createProcessor", () => {
  test("Should create processor which converts to and resolves base 64 strings", async () => {
    const b64 = createProcessor(
      (value: string) => {
        return Buffer.from(value).toString('base64');
      },
      (cell: string) => {
        return Buffer.from(cell, 'base64').toString('utf8'); 
      }
    );

    const createdStatement =
      await b64`INSERT INTO table_1_1 (message, recipient) VALUES ('${"Hello World"}', '${"John Doe"}');`;

    assert.match(
      createdStatement,
      "INSERT INTO table_1_1 (message, recipient) VALUES ('SGVsbG8gV29ybGQ=', 'Sm9obiBEb2U=');"
    );

    const resultSet = [
      { column: "SGVsbG8gV29ybGQ=", otherColumn: "SGVsbG8gV29ybGQ=" },
      { column: "Sm9obiBEb2U=", otherColumn: "Sm9obiBEb2U=" },
    ];

    const resultFromResolver = await b64.resolve(resultSet, ["column"]);

    assert.match(resultFromResolver[0].column, "Hello World");
    assert.match(resultFromResolver[0].otherColumn, "SGVsbG8gV29ybGQ=");
    assert.match(resultFromResolver[1].column, "John Doe");
    assert.match(resultFromResolver[1].otherColumn, "Sm9obiBEb2U=");
  });

  test("Built in encrypt example encrypts and decrypts", async () => {
    const encrypter = symmetricEncrypt("symmetric-secret");

    const createdStatement =
      await encrypter`INSERT INTO table_31337_1 (message, recipient) VALUES ('${"Hello World"}', '${"John Doe"}');`;
    const [world, john] = createdStatement.matchAll(
      /U2FsdGVkX[0-9a-zA-Z/+=]+/g
    );
    assert.match(
      createdStatement,
      `INSERT INTO table_31337_1 (message, recipient) VALUES ('${world}', '${john}');`
    );

    const results = await encrypter.resolve(
      [{ message: world.toString(), recipient: john.toString() }],
      ["message", "recipient"]
    );

    assert.match(results[0].message, "Hello World");
    assert.match(results[0].recipient, "John Doe");
  });

  test("should be able to skip", async function () {
    const encrypter = symmetricEncrypt("symmetric-secret");

    const partialEncrypt = JSON.parse(
      await encrypter`{"encrypted": "${"encrypted"}", "plain": "${skip(
        "plain"
      )}"}`
    );

    console.log(partialEncrypt);
    equal(partialEncrypt.plain, "plain");
    equal(partialEncrypt.encrypted.slice(0, 10), "U2FsdGVkX1");
  });

  test("throws an error if processor does not return a string", async function () {
    const subtraddify = createProcessor(
      (value: string) => {
        return Number(value) + 1;
      },
      (cell: string | number) => {
        return Number(cell.toString()) - 1;
      }
    );

    const insertStatement = subtraddify`INSERT INTO subtradd_31337_1 (val) VALUES (${"1"});`;
    await rejects(insertStatement, {
      name: "Error",
      message:
        "Defined processor function resulted in content that is not a string.",
    });
  });
});
