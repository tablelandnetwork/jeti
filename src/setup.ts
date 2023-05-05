import { defaultPin } from "./defaultPinFunction";

let globalPinFunction: Pin = defaultPin;

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

export { setup, globalPinFunction };
