import * as IPFS from "ipfs-http-client";
import createProcessor from "../processor";

export type FileContent = Uint8Array;

export class Pinner {
  ipfsOptions: IPFS.Options;
  ipfs: IPFS.IPFSHTTPClient;
  where: string;

  constructor(ipfsOptions = {}, where = "local") {
    this.ipfsOptions = ipfsOptions;
    this.ipfs = IPFS.create(this.ipfsOptions);
    this.where = where;
  }

  async pin(content: FileContent) {
    if (typeof content === "string") return content;

    const pinningService = await this.#_getRemotePinningService();
    const path = "";

    const { cid } = await this.ipfs.add(
      { content, path },
      { wrapWithDirectory: false }
    );

    if (this.where === "local") {
      await this.ipfs.pin.add(cid);
    } else {
      try {
        await this.ipfs.pin.remote.add(cid, {
          service: pinningService.service,
          name: "Tableland Upload",
        });
      } catch (err: any) {
        const message = err.message;
        if (!message.includes("DUPLICATE_OBJECT")) {
          throw err;
        }

        console.log(
          "This CID is already pinned to your pinning service."
        );
      }
    }

    return cid.toV1().toString();
  }

  async resolveCid(cid: string) {
    return await this.ipfs.get(cid);
  }

  async #_getRemotePinningService() {
    const pinningServices = await this.ipfs.pin.remote.service.ls();

    if (pinningServices.length < 1) {
      throw new Error("No remote pinning service connected.");
    }

    // TODO: why are we using the first value?
    return pinningServices[0];
  }
}

const localPinner = new Pinner();
const providerPinner = new Pinner({}, "provider");

export const pinToLocal = createProcessor(
  localPinner.pin.bind(localPinner),
  localPinner.resolveCid.bind(localPinner)
);
// TODO: Allow passing in the provider's endpoint.
//    How can this work if there's no way to set the provider?
//    Can users create there own instance with custom ipfsOptions?
export const pinToProvider = createProcessor(
  providerPinner.pin.bind(providerPinner),
  providerPinner.resolveCid.bind(providerPinner)
);
