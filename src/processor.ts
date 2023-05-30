function zip(firstArray: string[], secondArray: string[]) {
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

export interface RowObject {
  [key: string]: string | number;
}

export function skip(value: string) {
  return {
    jetiShouldSkip: true,
    original: value,
  };
}

export default function createProcessor(
  customProcessor: Function,
  resolver: Function
) {
  const prepare = async function prepare(
    strings: TemplateStringsArray,
    ...values: any[]
  ) {
    const strings2 = Array.from(strings);

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
    const statementAfterProcessing = zip(strings2, processedValues);

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
