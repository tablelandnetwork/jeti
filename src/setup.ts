import { defaultPin } from "./defaultPinFunction";
import * as IPFS from 'ipfs-http-client';

let globalPinFunction: Pin = defaultPin;
let globalIpfsClient = IPFS.create();

interface Pin {
  (content: Uint8Array, _name: string | null): Promise<{
    cid: string,
    pinned: boolean
  }>;
}


interface SetupOptions {
  pin?: Pin
}

function setup(options: SetupOptions) {
  if(options.pin)
    globalPinFunction = options.pin;
}

export { setup, globalPinFunction, globalIpfsClient };
