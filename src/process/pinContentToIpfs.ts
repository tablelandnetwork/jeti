import * as IPFS from "ipfs-http-client";
import createProcessor from "../process";
type FileContent = Uint8Array;

async function pinToLocalBase(content: FileContent) {
  return await pin(content);
}

async function pinToProviderBase(content: FileContent) {
  // TODO: Allow passing in the provider's endpoint
  return await pin(content, "provider");
}

async function pin(content: FileContent, where = "local") {
  if (typeof content === "string") return content;
  const ipfs = await IPFS.create();

  const pinningServices = await ipfs.pin.remote.service.ls();

  const hasRemotePinningService = pinningServices.length > 0;

  if (!hasRemotePinningService) {
    const noPinningService = "No remote pinning service connected.";
    throw noPinningService;
  } else {
    const path = "";

    const res = await ipfs.add(
      { content, path },
      { wrapWithDirectory: path !== "" }
    );
    const { cid } = res;

    if (where === "local") {
      await ipfs.pin.add(cid);
    } else {
      await ipfs.pin.remote
        .add(cid, {
          service: pinningServices[0].service,
          name: "Tableland Upload",
        })
        .catch((err: any) => {
          const message: string = err.message;
          if (message.includes("DUPLICATE_OBJECT")) {
            console.log(
              "Good news; that CID is already pinned to your pinning service."
            );
            return;
          }
          throw err;
        });
    }

    return cid.toV1().toString();
  }
}

async function resolveCid(cid: string) {
  const ipfsClient = await IPFS.create();
  const res = await ipfsClient.get(cid);
  return res;
}

export const pinToLocal = createProcessor(pinToLocalBase, resolveCid);
export const pinToProvider = createProcessor(pinToProviderBase, resolveCid);
