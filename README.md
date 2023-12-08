# @tableland/jeti

[![Review](https://github.com/tablelandnetwork/jeti/actions/workflows/review.yml/badge.svg)](https://github.com/tablelandnetwork/jeti/actions/workflows/review.yml)
[![Test](https://github.com/tablelandnetwork/jeti/actions/workflows/test.yml/badge.svg)](https://github.com/tablelandnetwork/jeti/actions/workflows/test.yml)
[![License: MIT AND Apache-2.0](https://img.shields.io/badge/License-MIT%20AND%20Apache--2.0-blue.svg)](./LICENSE)
[![Version](https://img.shields.io/github/v/release/tablelandnetwork/jeti)](./package.json)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg)](https://github.com/RichardLitt/standard-readme)

> An IPFS and generic plugin framework for inserting & retrieving data with the @tableland/sdk

## Table of Contents

- [Background](#background)
- [Install](#install)
- [Usage](#usage)
  - [Set up Tableland database](#set-up-tableland-database)
  - [Pin to IPFS](#pin-to-ipfs)
  - [Truncate](#truncate)
  - [Create your own](#create-your-own)
- [Development](#development)
- [Contributing](#contributing)
- [License](#license)

## Background

The [`@tableland/jeti`](https://github.com/tablelandnetwork/jeti) library builds on top of the [`@tableland/sdk`](https://github.com/tablelandnetwork/tableland-js/packages/sdk), allowing you to easily add IPFS data to Tableland and read the underlying data from Tableland. Simply import the library, connect to the Tableland network, and you are ready to start creating, updating, and reading table data.

JETI (JavaScript Extension for Tableland Integrations) is also designed to be extensible. You can create you own custom plugins/processors that transform data inserted into tables or retrieved from tables. For example, the IPFS plugin processes data and inserts a CID in to a cell, and when data is read, it will "see" the CID and fetch/transform the underlying content within the query response. You can do whatever you'd like with an implementation suing the `creatorProcessor` method.

## Install

Installation is easy using npm or yarn. An ES bundle is also available for those operating purely in a browser environment.

```bash
npm i @tableland/jeti
```

## Usage

Before getting started, you'll need to set up and have an IPFS node running. For example, IPFS Desktop exposes the API on `http://127.0.0.1:5001` by default; you'll then need to pass host/port information to connect to the IPFS node, which are endpoints defined in the [IPFS HTTP API](https://docs.ipfs.tech/reference/http/api/).

For the full documentation, see the docs page: [here](https://docs.tableland.xyz/sdk/plugins/).

### Set up Tableland database

First, connect and create a table. You'll want to make sure `@tableland/sdk` is installed as well, and this example shows ethers for setting up a signer with a private key on a local-only [Local Tableland](https://github.com/tablelandnetwork/tableland-js/tree/main/packages/local) network running.

```js
import { Database } from "@tableland/sdk";
import { Wallet, getDefaultProvider } from "ethers";

// Set up signer
const privateKey =
  "59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
const wallet = new Wallet(privateKey);
// To avoid connecting to the browser wallet (locally, port 8545).
// For example: "https://polygon-mumbai.g.alchemy.com/v2/YOUR_ALCHEMY_KEY"
const provider = getDefaultProvider("http://127.0.0.1:8545");
const signer = wallet.connect(provider);

// Connect to database & create table
const db = new Database({ signer });
const { meta: create } = await db
  .prepare(`CREATE TABLE my_table (id integer primary key, val text);`)
  .run();
await create.txn?.wait();
const [tableName] = create.txn?.names ?? [];
console.log(tableName); // my_table_31337_2
```

### Pin to IPFS

In this example, using `pinToLocal` as a tagged template will insert the proper values in your statement, while simultaneously uploading files to your remote pinning services.

Using the `resolve` function of `pinToLocal` fetches the data from IPFS into the result set.

```JavaScript
// Existing imports
// For pinning to a local IPFS node
import { pinToLocal, skip } from "@tableland/jeti";

// Database/table setup steps from above

// Set up pinner for string templating
const localPinner = pinToLocal({
  host: "127.0.0.1",
  port: 5001,
  protocol: "http",
});

// Define content and process SQL string
const contentToPin = "Hello world"; // A string, or a file buffer (Uint8Array)
const sql = await localPinner`insert into ${skip(
  tableName
)} (val) values ('${contentToPin}');`; // Converts non-skipped variable to CID
console.log(sql);

// Insert the transformed data with a CID
const { meta: insert } = await db.prepare(sql).all();
await insert.txn?.wait();
```

When you read the raw results, it'll contain the CID that was inserted, unless to `resolve` the results with the pinner:

```js
const { results } = await db.prepare(`SELECT * FROM ${tableName}`).all();
console.log(results);
// [
//   {
//     id: 1,
//     val: 'bafybeiabfiu2uipule2sro2maoufk2waokktnsbqp5gvaaod3y44ouft54'
//   }
// ]

const resultsWithCIDsResolved = await localPinner.resolve(results, ["val"]);
console.log(resultsWithCIDsResolved);
// [
//   {
//     id: 1,
//     val: 'Hello world'
//   }
// ]
```

The `pinToProvider` follows nearly the same steps, except is assumes you've configured a remote pinning provider on your IPFS node. For example, if you've configured Pinata, you can use the `pinToProvider` template to pin to Pinata.

### Truncate

Table cells have a max limit of 1 KB (1024 bytes), so the IPFS plugin is especially useful for data larger than that. However, if you're okay with lossy data that gets cut at 1024 bytes, the `truncate` plugin can be used:

```js
import { truncate } from "@tableland/jeti";

// 1025 letter 'a's, i.e., 1025 bytes is one over the limit
const longString = new Array(1026).join("a"); // First value is `undefined`, so it will be skipped

const sql =
  await truncate`INSERT INTO my_table_31337_2 (val) values ('${longString}')`;
```

Since the input string was one byte over the limit, it will be truncated to 1024 bytes. When you resolve it, the original string will not be returned—an ellipses is appended to represent the truncation occurred:

```js
const detruncated = await truncate.resolve([{ val: `${longString}` }], ["val"]);
console.log(detruncated); // Truncated input at 1024 bytes plus `...`
```

### Create your own

Creating your own processor requires two function to be created: one for transforming inputs _before_ data is created, and one for transforming the data _after_ it is read. For example, if you wanted to add a value to the end of a string before it is inserted, and remove it when it is read, you could do the following:

```js
import { createProcessor } from "@tableland/jeti";

function addValue(value: string): PrepareResult {
  const add = (input: string) => {
    return input + value;
  };

  const remove = (input: string) => {
    return input.replace(value, "");
  };

  return createProcessor(add, remove);
}
```

Then, set up the processor and insert data:

```js
const processor = addValue(" world");
const originalValueOne = "Hello";
const originalValueTwo = "Hello again";

const sql =
  await processor`INSERT INTO my_table_31337_2 (val) VALUES ('${originalValueOne}'), ('${originalValueTwo}');`;
console.log(sql);
// INSERT INTO my_table_31337_2 VALUES ('Hello world'), ('Hello again world');
```

The processor is designed to work with the parameter and response types from the Tableland SDK. But, to emulate it's functionality, we can do the following and resolve the results:

```js
const rawResults = [
  {
    id: 1,
    val: "Hello world",
  },
  {
    id: 2,
    val: "Hello again world",
  },
];

const unprocessedResults = await processor.resolve(rawResults, ["val"]);
console.log(unprocessedResults);
// [
//   {
//     id: 1,
//     val: "Hello",
//   },
//   {
//     id: 2,
//     val: "Hello again",
//   },
// ];
```

## Development

Get started by cloning, installing, building, and testing the project:

```shell
git clone https://github.com/tablelandnetwork/jeti.git
cd jeti
npm install
npm run build
npm test
```

## Contributing

PRs accepted.

Small note: If editing the README, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## License

MIT AND Apache-2.0, © 2021-2023 Tableland Network Contributors
