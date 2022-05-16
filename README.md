# @tableland/jeti (JavaScript Extension for Tableland and IPFS)

[![Lint and test](https://github.com/tablelandnetwork/js-tableland/actions/workflows/lint-and-test.yml/badge.svg)](https://github.com/tablelandnetwork/js-tableland/actions/workflows/lint-and-test.yml)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/tablelandnetwork/js-tableland.svg)](./package.json)
[![Release](https://img.shields.io/github/release/tablelandnetwork/js-tableland.svg)](https://github.com/tablelandnetwork/js-tableland/releases/latest)
[![standard-readme compliant](https://img.shields.io/badge/standard--readme-OK-green.svg)](https://github.com/RichardLitt/standard-readme)

A TypeScript/JavaScript library for inserting and extracting IPFS data to and from Tableland queries using the `@tableland/sdk`. 

# Table of Contents

- [@tableland/jeti (JavaScript Extension for Tableland and IPFS)](#tablelandjeti-javascript-extension-for-tableland-and-ipfs)
- [Table of Contents](#table-of-contents)
- [Background](#background)
- [Install](#install)
- [Usage](#usage)
- [API](#api)
  - [Connecting to Tableland](#connecting-to-tableland)
- [Feedback](#feedback)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

# Background

The Tableland project provides a zero-config Typescript/Javascript SDK that make it easy to interact with the Tableland network from Ethereum-based applications. The [`@tableland/jeti`](https://github.com/tablelandnetwork/js-tableland-ipfs) SDK builds on that, allowing using to easily add IPFS data to tableland, and read the data from tableland.

Simply import the library, connect to the Tableland network, and you are ready to start creating and updating tables.

# Install

Installation is easy using npm or yarn. An ES bundle is also available for those operating purely in a browser environnement.

```bash
npm i @tableland/jeti
```

> Note: Not seeing the build type you need for your project or idea? Let us know, we're happy to work with you to improve the SDK usability!

# Usage

Most common Tableland usage patterns will follow something like the following. In general, you'll need to connect, create, mutate, and query your tables. In that order :)

```typescript
import { connect } from "@tableland/sdk";
import { prepare, resolve } from "@tableland/jeti";

const connection = await connect({ network: "testnet" });



let id = connection.create(
  `CREATE TABLE table (id int primary key, name text, avatar_cid text, primary key (id))`
);

const avatar = new Blob([/* avatar img file contents here */]);

let res = await prepare`INSERT INTO Table_01 (firstname, avatar}) VALUES ('Murray', ${avatar});`;

connect.query(res);

const { rows, columns } = await resolve(res, ['avatar']); 
// Instead of containing the CID from the database, 
// 'row' now contains the actual content

```

Fun fact: If you're using JETI in the browser with your local IPFS node, you'll need to change your HTTPHeaders Accessn control policy, like so: 

```
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Methods '["PUT", "POST", "GET"]'
ipfs config --json API.HTTPHeaders.Access-Control-Allow-Origin  '["*"]'
```

# API

[Full library documentation available on GitHub](https://tablelandnetwork.github.io/js-tableland/)!

## Connecting to Tableland

The `@tableland/sdk` library includes functions for connecting to remote clients, creating and mutating tables, querying existing tables, and listing all user tables. 

The `prepare` function can be used to connect to prepare a statement.

With `resolve`, the user fetches data from IPFS into the result set. 

# Feedback

Reach out with feedback and ideas:

- [twitter.com/tableland\_\_](https://twitter.com/tableland__)
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
