import * as IPFS from "ipfs-http-client";
type FileContent = Uint8Array;
// ipfs.add all supports these:
// May add support later.
// | String
// | Iterable<Uint8Array>
// | AsyncIterable<Uint8Array>
// | ReadableStream<Uint8Array>;

export async function defaultPin(content: FileContent, _name: string | null = null) {
  const ipfs = await IPFS.create();

  const pinningServices = await ipfs.pin.remote.service.ls();

  const hasRemotePinningService = pinningServices.length > 0;

  if (!hasRemotePinningService) {
    const noPinningService = "No remote pinning service connected.";
    throw noPinningService;
  } else {
    let path = "";
    if (_name) {
      path = `/${_name}`;
    }

    const res = await ipfs.add(    
      { content, path },
      { wrapWithDirectory: path !== "" }
    );
    const { cid } = res;
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

    return {
      cid: cid.toV1().toString(),
      pinned: true
    }
  }
}
