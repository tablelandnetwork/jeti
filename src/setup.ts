import { defaultPin } from "./defaultPinFunction";
import * as IPFS from 'ipfs-http-client';

interface Pin {
  (content: Uint8Array, _name: string | null): Promise<{
    cid: string,
    pinned: boolean
  }>;
}

let globalPinFunction: Pin = defaultPin;
const globalIpfsClient = IPFS.create();

interface SetupOptions {
  pin?: Pin
}

function setup(options: SetupOptions) {
  if(options.pin)
    globalPinFunction = options.pin;
}

export { setup, globalPinFunction, globalIpfsClient };
