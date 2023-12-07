import CryptoJS from "crypto-js";
import { createProcessor, PrepareResult } from "../processor";

/**
 * An object containing a secret and salt.
 * @property secret A secret string used to encrypt and decrypt content.
 * @property salt A salt string used to encrypt and decrypt content.
 */
export interface SecretAndSalt {
  secret: string;
  salt: string;
}

/**
 * Generates a random 256 bit secret and salt for use in symmetric encryption.
 * @returns An array containing the secret and salt as {@link SecretAndSalt}.
 */
export function generateRandomSecretAndSalt(): SecretAndSalt {
  const fixedSalt = CryptoJS.lib.WordArray.random(128 / 8);
  const randomKey = CryptoJS.lib.WordArray.random(32);
  return {
    secret: randomKey.toString(CryptoJS.enc.Hex),
    salt: fixedSalt.toString(CryptoJS.enc.Hex),
  };
}

/**
 * Creates a function that encrypts and decrypts content using AES encryption,
 * used in a SQL template literal. The encryption is symmetric, meaning the same
 * secret is used to both encrypt and decrypt content.
 *
 * Note: this is, in part, a demonstration of how to implement your own
 * processor; it is not recommended to use this in production as more secure
 * options exist.
 * @param secret A secret string used to encrypt and decrypt content.
 * @param salt A salt string used to encrypt and decrypt content.
 * @returns An instance of {@link PrepareResult}.
 */
export function symmetricEncrypt(secret: string, salt: string): PrepareResult {
  const encrypt = (value: string) => {
    const key = CryptoJS.PBKDF2(secret, salt, {
      keySize: 256 / 32,
      iterations: 1000,
    });

    const iv = CryptoJS.lib.WordArray.random(128 / 8);
    const encrypted = CryptoJS.AES.encrypt(value, key, { iv });
    return iv.toString() + encrypted.toString();
  };

  const decrypt = (value: string) => {
    const key = CryptoJS.PBKDF2(secret, salt, {
      keySize: 256 / 32,
      iterations: 1000,
    });

    const iv = CryptoJS.enc.Hex.parse(value.slice(0, 32));
    const encrypted = value.slice(32);
    const decrypted = CryptoJS.AES.decrypt(encrypted, key, { iv });
    return decrypted.toString(CryptoJS.enc.Utf8);
  };

  return createProcessor(encrypt, decrypt);
}
