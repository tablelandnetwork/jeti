import * as IPFS from "ipfs-http-client";
import { createProcessor } from "../processor";
import { Buffer } from "buffer";

export type FileContent = Uint8Array;

export class Pinner {
  /**
   * @param ipfsOptions - Options to pass to IPFS.create(); only used if `where` is "provider".
   * @param ipfs - IPFS instance to use. If not provided, a new one will be created.
   * @param where - Where to pin the content. "local" or "provider". Defaults to "local".
   * @returns The CID of the pinned content.
   *
   * Note: the available options are part of the "ipfs-http-client" package.
   * The `Options` object is inclusive of:
   * host?: string
   * port?: number
   * protocol?: string
   * headers?: Headers | Record<string, string>
   * timeout?: number | string
   * apiPath?: string
   * url?: URL|string|Multiaddr
   * ipld?: Partial<IPLDOptions>
   * agent?: HttpAgent | HttpsAgent
   */
  ipfsOptions: IPFS.Options;
  ipfs: IPFS.IPFSHTTPClient;
  where: string;

  constructor(ipfsOptions = {}, where = "local") {
    this.ipfsOptions = ipfsOptions;
    this.ipfs = IPFS.create(this.ipfsOptions);
    this.where = where;
  }

  async pin(content: string | FileContent) {
    if (!content || content.length === 0) {
      throw new Error("Content is empty or undefined; no CID created.");
    }
    const textEncoder = new TextEncoder();
    // Convert strings to Uint8Array aka FileContent
    content =
      typeof content === "string" ? textEncoder.encode(content) : content;

    const { cid } = await this.ipfs.add(content, { wrapWithDirectory: false });

    if (this.where === "local") {
      await this.ipfs.pin.add(cid);
    } else {
      try {
        const pinningService = await this.#_getRemotePinningService();
        await this.ipfs.pin.remote.add(cid, {
          service: pinningService.service,
          name: "Tableland Upload",
        });
      } catch (err: any) {
        const message = err.message;
        if (!message.includes("DUPLICATE_OBJECT")) {
          throw err;
        }

        console.log("This CID is already pinned to your pinning service.");
      }
    }

    return cid.toV1().toString();
  }

  async resolveCid(cid: string) {
    const entries = this.ipfs.cat(cid);
    const iterator = entries[Symbol.asyncIterator]();

    let data: any[] = [];
    while (true) {
      const result = await iterator.next();
      if (result.done) {
        break;
      }

      const { value } = result;
      data = [...data, ...value];
    }
    const raw = Buffer.from(data).toString("utf8");
    return raw;
  }

  async #_getRemotePinningService() {
    const pinningServices = await this.ipfs.pin.remote.service.ls();

    if (pinningServices.length === 0) {
      throw new Error("No remote pinning service connected.");
    }

    // TODO: first value is used, but should be based on user preference for
    // which remote pinning service to use.
    return pinningServices[0];
  }
}

export function pinToLocal(opts?: IPFS.Options) {
  const localPinner = new Pinner(opts, "local");
  return createProcessor(
    localPinner.pin.bind(localPinner),
    localPinner.resolveCid.bind(localPinner)
  );
}

export function pinToProvider(opts?: IPFS.Options) {
  const providerPinner = new Pinner(opts, "provider");
  return createProcessor(
    providerPinner.pin.bind(providerPinner),
    providerPinner.resolveCid.bind(providerPinner)
  );
}
