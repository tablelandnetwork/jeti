import { globalIpfsClient } from "./ipfs-http-client-setup.js";

interface ResultSet {
  columns: Array<any>;
  rows: Array<any>;
}

async function resolve(
  resultSet: ResultSet,
  columnsToResolve: [string]
): Promise<ResultSet> {
  const ipfs = await globalIpfsClient;
  const resolveColumnIndex: Array<number> = [];
  resultSet.columns.forEach((column, key) => {
    if (columnsToResolve.includes(column.name)) {
      resolveColumnIndex.push(key);
    }
  });

  const resolveSet = resultSet;

  resolveSet.rows = resultSet.rows.map(async (row) => {
    const resolvingRow = row.map((cell: any, key: number) => {
      if (resolveColumnIndex.includes(key)) {
        return ipfs.cat(cell);
      }
      return cell;
    });
    return resolvingRow;
  });

  resolveSet.rows = await Promise.all(resolveSet.rows);

  return resolveSet;
}

export { resolve };
