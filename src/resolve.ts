import { globalIpfsClient } from "./ipfs-http-client-setup.js";

// New type definitions
interface ResultRow {
  [key: string]: string | number;
}

interface ResultSet {
  [index: number]: ResultRow;
}

interface IPFSResolveResultRow {
  [key: string]: string | number | AsyncIterable<Uint8Array>;
}

interface IPFSResolveResultSet {
  [index: number]: IPFSResolveResultRow;
}

// Updated function
async function resolve(
  resultSet: ResultSet,
  columnsToResolve: string[]
): Promise<IPFSResolveResultSet> {
  const ipfs = await globalIpfsClient;
  const resolveColumnNames: Set<string> = new Set(columnsToResolve);

  const resolveSet: IPFSResolveResultSet = {};

  for (const index in resultSet) {
    const row = resultSet[index];
    const resolvingRow: IPFSResolveResultRow = {};

    for (const key in row) {
      if (resolveColumnNames.has(key)) {
        resolvingRow[key] = await ipfs.cat(row[key] as any);
      } else {
        resolvingRow[key] = row[key];
      }
    }

    resolveSet[index] = resolvingRow;
  }

  return resolveSet;
}
export { resolve };
