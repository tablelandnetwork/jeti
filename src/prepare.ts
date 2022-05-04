import { globalIpfsClient } from "./ipfs-http-client-setup.js";

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

type FileContent = Uint8Array | Blob;
// ipfs.add all supports these:
// May add support later.
// | String
// | Iterable<Uint8Array>
// | AsyncIterable<Uint8Array>
// | ReadableStream<Uint8Array>;

async function sendToPinned(content: FileContent) {
  const ipfs = await globalIpfsClient;

  const pinningServices = await ipfs.pin.remote.service.ls();

  const hasRemotePinningService = pinningServices.length > 0;

  if (!hasRemotePinningService) {
    const noPinningService = "No remote pinning service connected.";
    throw noPinningService;
  } else {
    const { cid } = await ipfs.add(content);

    ipfs.pin.remote.add(cid, {
      service: pinningServices[0].service,
      name: "Tableland Upload",
    });
    return cid.toV1().toString();
  }
}

// If you want to save a string to IPFS, simply encode it
// Do this using `new TextEncoder().encode("Your string here")`
async function prepare(strings: TemplateStringsArray, ...values: any[]) {
  const strings2 = Array.from(strings);

  const prom = values.map(async (value): Promise<string> => {
    let res = value;
    switch (true) {
      case value instanceof Blob:
        res = await sendToPinned(await value.arrayBuffer());
        break;
      case value instanceof Uint8Array:
        res = await sendToPinned(value);
        break;
    }
    return res;
  });

  const processedValues = await Promise.all(prom);
  return zip(strings2, processedValues);
}

export { prepare };
