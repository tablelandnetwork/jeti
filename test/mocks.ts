export const ipfs = () => {
  return {
    add: async () => {
      return {
        cid: {
          toV1: () => {
            return {
              toString: () => {
                return "ipfs://bafy";
              },
            };
          },
        },
      };
    },
    cat: (arg1: any) => {
      if (arg1 === "ipfs://bafy") {
        return Uint8Array.from([0, 1, 5]);
      }
      return Uint8Array.from([1]);
    },
    pin: {
      remote: {
        add: async () => {},
        service: {
          ls: () => [0],
        },
      },
    },
  };
};
