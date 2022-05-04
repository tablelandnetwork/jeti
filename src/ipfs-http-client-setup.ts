import * as IPFS from "ipfs-http-client";
import { IPFSHTTPClient } from "ipfs-http-client/types/src/types";

let globalIpfsClient = IPFS.create();

function optionalSetup(ipfsClient: IPFSHTTPClient) {
  globalIpfsClient = ipfsClient;
}

export { optionalSetup, globalIpfsClient };
