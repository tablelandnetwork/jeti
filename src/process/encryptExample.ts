// Example with configuration
import CryptoJS from "crypto-js";
import createProcess from "../process";

export default (secret: string) => {
  const encrypt = (value: string) => {
    return CryptoJS.AES.encrypt(value, secret).toString();
  }
  
  const decrypt = (value: string) => {
    return CryptoJS.AES.decrypt(value, secret).toString(CryptoJS.enc.Utf8);
  }

  return createProcess(encrypt, decrypt)
};
