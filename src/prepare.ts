import * as IPFS from "ipfs-http-client";

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

async function BlobToPinnedIpfs(blob: Blob) {
  const ipfs = await IPFS.create({});

  const pinningServices = await ipfs.pin.remote.service.ls();

  const hasRemotePinningService = pinningServices.length > 0;

  if (!hasRemotePinningService) {
    const noPinningService = "No remote pinning service connected.";
    throw noPinningService;
  } else {
    const { cid } = await ipfs.add(await blob.arrayBuffer());

    ipfs.pin.remote.add(cid, {
      service: pinningServices[0].service,
      name: "Tableland Upload",
    });
    return cid.toV1().toString();
  }
}

async function prepare(strings: TemplateStringsArray, ...values: any[]) {
  const strings2 = Array.from(strings);

  const prom = values.map(async (value): Promise<string> => {
    let res = value;
    switch (true) {
      case value instanceof Blob:
        res = await BlobToPinnedIpfs(value);
        break;
    }
    return res;
  });

  const processedValues = await Promise.all(prom);
  return zip(strings2, processedValues);
}

export { prepare };
