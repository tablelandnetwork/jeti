function zip(firstArray: string[], secondArray: string[]): string {
  let str = "";
  for (let i = 0; i < firstArray.length; i++) {
    if (secondArray[i]) {
      str += firstArray[i] + secondArray[i];
    } else {
      str += firstArray[i];
    }
  }

  return str;
}

/**
 * Represents a row of data in a table.
 */
export type RowObject = Record<string, unknown>;

/**
 * Defines skipping behavior for a value such that is will not be pinned to
 * IPFS. This is useful for values like a table name passed to a string
 * templated query string. E.g., `const sql = pinToLocal`insert into
 * ${skip(tableName)} (message) values ('${contentToPin}');`;`
 * @param value The value to skip.
 * @returns An object that defines skipping behavior where `jetiShouldSkip` is
 * `true` and `original` is the original value.
 */
export function skip(value: string) {
  return {
    jetiShouldSkip: true,
    original: value,
  };
}

export interface PrepareResult {
  (strings: TemplateStringsArray, ...values: any[]): Promise<string>;
  resolve(resultSet: RowObject[], keysToResolve: string[]): Promise<any[]>;
}

/**
 * Creates a function that processes content and resolves it.
 * @param customProcessor A custom function that processes the content.
 * @param resolver A custom function that resolves the content.
 * @returns An instance of {@link PrepareResult}.
 */
export default function createProcessor(
  customProcessor: Function,
  resolver: Function
): PrepareResult {
  const prepare = async function prepare(
    strings: TemplateStringsArray,
    ...values: any[]
  ) {
    const stringsArr = Array.from(strings);

    const prom = values.map(async (value): Promise<string> => {
      if (value.jetiShouldSkip) {
        return value.original;
      }
      const result = await customProcessor(value);

      if (typeof result !== "string") {
        throw new Error(
          "Defined processor function resulted in content that is not a string."
        );
      }
      return result;
    });

    const processedValues = await Promise.all(prom);
    const statementAfterProcessing = zip(stringsArr, processedValues);

    return statementAfterProcessing;
  };

  prepare.resolve = async function resolve(
    resultSet: RowObject[],
    keysToResolve: string[]
  ) {
    const resultsRequests = resultSet.map(async (row: RowObject) => {
      // needs to be `any` since the resolver is being plugged into this package
      const resolvedRow: any = {};
      for (const key in row) {
        if (keysToResolve.includes(key)) {
          const value = row[key];
          resolvedRow[key] = await resolver(value);
        } else {
          resolvedRow[key] = row[key];
        }
      }
      return resolvedRow;
    });

    return await Promise.all(resultsRequests);
  };
  return prepare;
}

export { createProcessor };
