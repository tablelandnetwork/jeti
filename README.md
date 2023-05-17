# @tableland/jeti (JavaScript Extension for Tableland Integrations)

[![Lint and test](https://github.com/tablelandnetwork/js-tableland/actions/workflows/lint-and-test.yml/badge.svg)](https://github.com/tablelandnetwork/js-tableland/actions/workflows/lint-and-test.yml)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/tablelandnetwork/js-tableland.svg)](./package.json)
[![Release](https://img.shields.io/github/release/tablelandnetwork/js-tableland.svg)](https://github.com/tablelandnetwork/js-tableland/releases/latest)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg)](https://github.com/RichardLitt/standard-readme)

A TypeScript/JavaScript library for inserting and extracting IPFS data to and from Tableland queries using the `@tableland/sdk`.

This library is only compatible with version 3 of `@tableland/sdk`.

# Table of Contents

- [@tableland/jeti (JavaScript Extension for Tableland Integrations)](#tablelandjeti-javascript-extension-for-tableland-integrations)
- [Table of Contents](#table-of-contents)
- [Background](#background)
- [Install](#install)
- [Usage](#usage)
  - [Pin to IPFS](#pin-to-ipfs)
  - [Create your own](#create-your-own)
  - [More uses](#more-uses)
- [Feedback](#feedback)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

# Background

The Tableland project provides a zero-config Typescript/Javascript SDK that make it easy to interact with the Tableland network from Ethereum-based applications. The [`@tableland/jeti`](https://github.com/tablelandnetwork/js-tableland-ipfs) SDK builds on that, allow you to easily add IPFS data to tableland, and read the data from tableland.

Simply import the library, connect to the Tableland network, and you are ready to start creating and updating tables.

# Install

Installation is easy using npm or yarn. An ES bundle is also available for those operating purely in a browser environnement.

```bash
npm i @tableland/jeti
```

> Note: Not seeing the build type you need for your project or idea? Let us know, we're happy to work with you to improve the SDK usability!

# Usage

### Pin to IPFS

In this example, using `pinToLocal` as a tagged template will insert the proper values in your statement, while simultaniously uploading files to your remote pinning services.

Using the `resolve` function of `pinToLocal` fetches the data from IPFS into the result set.

```JavaScript
import { Database } from "@tableland/sdk";

// For pinning to a local IPFS node
import { pinToLocal, skip } from "@tableland/jeti";

const db = new Database();

const query = await pinToLocal`INSERT INTO MyTable_31337_1 (id, file) values (1, '${file}');`
// Result: INSERT INTO MyTable_31337_1 (id, file) values (id, 'ipfs://bafy...etc');
// The pinToLocal also pinned the file to your local IPFS node.

db.prepare(query).all();

// 1 block time later.

const resultSet = await db.prepare("SELECT * FROM MyTable_31337_1;").all();

// Only attempts to fetch 'file' column from IPFS
const { rows, columns } = await pinToLocal.resolve(resultSet, ["file"]);

```

### Create your own

```JavaScript
import { createProcessor } from '@tableland/jeti';

import { createProcessor } from "@tableland/jeti";
import { ipfsPin, ipfsFetch } from "some-custom-ipfs-lib";

const ipfs = createProcessor(ipfsPin, ipfsFetch);

const db = new Database();

const message = getFile();
const image = getImage();
const query = await ipfs`
INSERT
  INTO MyTable_31337_1
    (id, message, image)
    values
    (
      0,
      '${message}',
      '${image}'
    )`;
```

This would use your implementations of the asynchronous functions which are use in the template. The functions can have side effects. The only rule is they might ultimately return a string.

### More uses

More uses can be found in [our docs](https://docs.tableland.xyz)

# Feedback

Reach out with feedback and ideas:

- [twitter.com/tableland](https://twitter.com/tableland)
- [Create a new issue](https://github.com/tablelandnetwork/js-tableland/issues)

# Maintainers

[@awmuncy](https://github.com/awmuncy)

# Contributing

PRs accepted.

To get started clone this repo, then do:

```bash
# use the latest node and npm LTS
npm install
npm run build

# see if everything is working
npm test
```

Small note: If editing the README, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

# License

MIT AND Apache-2.0, © 2021-2022 Tableland Network Contributors
