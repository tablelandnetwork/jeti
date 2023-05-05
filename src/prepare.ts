import { globalPinFunction } from "./setup.js";

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



// If you want to save a string to IPFS, simply encode it
// Do this using `new TextEncoder().encode("Your string here")`
async function prepare(strings: TemplateStringsArray, ...values: any[]) {
  const strings2 = Array.from(strings);

  const prom = values.map(async (value): Promise<string> => {
    let res = value;
    switch (true) {
      case value instanceof Uint8Array:
        res = await globalPinFunction(value, null);
        break;
    }
    return res;
  });

  const processedValues = await Promise.all(prom);
  return zip(strings2, processedValues);
}

export { prepare };
