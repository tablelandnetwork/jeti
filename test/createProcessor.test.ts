import { equal, notEqual, rejects } from "node:assert/strict";
import { Buffer } from "buffer";
import { describe, test } from "mocha";
import { assert } from "sinon";
import {
  createProcessor,
  generateRandomSecretAndSalt,
  symmetricEncrypt,
  skip,
} from "../src/main";

describe("createProcessor", () => {
  test("should create processor which converts to and resolves base 64 strings", async () => {
    const b64 = createProcessor(
      (value: string) => {
        return Buffer.from(value).toString("base64");
      },
      (cell: string) => {
        return Buffer.from(cell, "base64").toString("utf8");
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

  test("should encrypt and decrypt values in a SQL string", async () => {
    const { secret, salt } = generateRandomSecretAndSalt();
    const encrypter = symmetricEncrypt(secret, salt);

    const originalMessage = "Hello World";
    const originalRecipient = "John Doe";
    const encryptedStatement =
      await encrypter`INSERT INTO table_31337_1(message,recipient)VALUES('${originalMessage}','${originalRecipient}');`;
    // Get the encrypted values from the statement
    const regex = /VALUES\s*\('([^']*)','([^']*)'\)/i;
    const matches = regex.exec(encryptedStatement);
    const encryptedMessage = matches![1];
    const encryptedRecipient = matches![2];

    // Ensure the encrypted values are not the same as the original values
    notEqual(originalMessage, encryptedMessage);
    notEqual(originalRecipient, encryptedRecipient);

    // Decrypt the encrypted values
    const decryptedStatement = await encrypter.resolve(
      [
        {
          message: encryptedMessage.toString(),
          recipient: encryptedRecipient.toString(),
        },
      ],
      ["message", "recipient"]
    );

    // Ensure the decrypted values are the same as the original values
    assert.match(decryptedStatement[0].message, originalMessage);
    assert.match(decryptedStatement[0].recipient, originalRecipient);
  });

  test("should be able to skip", async function () {
    const { secret, salt } = generateRandomSecretAndSalt();
    const encrypter = symmetricEncrypt(secret, salt);

    const valueToEncrypt = "encrypted";
    const valueToSkip = "plain";
    const partialEncrypt = JSON.parse(
      await encrypter`{"encrypted": "${valueToEncrypt}", "plain": "${skip(
        valueToSkip
      )}"}`
    );

    // Ensure the encrypted value is not the same as the original value
    equal(partialEncrypt.plain, valueToSkip);
    notEqual(partialEncrypt.encrypted, valueToEncrypt);
  });

  test("should throw an error if processor does not return a string", async function () {
    const invalidProcessor = createProcessor(
      (value: string) => {
        return Number(value) + 1;
      },
      (cell: string | number) => {
        return Number(cell.toString()) - 1;
      }
    );

    const insertStatement = invalidProcessor`INSERT INTO invalid_31337_1 (val) VALUES (${"1"});`;
    await rejects(insertStatement, {
      name: "Error",
      message:
        "Defined processor function resulted in content that is not a string.",
    });
  });
});
