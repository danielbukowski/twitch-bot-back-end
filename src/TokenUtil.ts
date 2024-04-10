import { AccessToken } from "@twurple/auth";
import { Initializable } from "./ObjectManager";
import { readFile, readdir, writeFile } from "fs/promises";
import { createCipheriv, pbkdf2Sync, randomBytes, CipherGCM, CipherGCMTypes, createDecipheriv, DecipherGCM } from "crypto";

export type TokenIntent = "events" | "chat";

export default class TokenUtil implements Initializable {
  private readonly regExpToGetIdFromToken: RegExp = /[-\\.]/;
  private readonly ALGORITHM_NAME: CipherGCMTypes = "aes-128-gcm";
  private readonly ALGORITHM_NONCE_SIZE: number = 12;
  private readonly ALGORITHM_TAG_SIZE: number = 16;
  private readonly ALGORITHM_KEY_SIZE: number = 16;
  private readonly PBKDF2_NAME: string = "sha256";
  private readonly PBKDF2_SALT_SIZE: number = 18;
  private readonly PBKDF2_ITERATIONS: number = 33217;

  private readonly scopeForChat: ReadonlyArray<string> =  ["chat:edit","chat:read"];
  private readonly scopeForEvents: ReadonlyArray<string> = ["moderator:read:follows"];

  public constructor(
    private readonly encryptionPassphrase: string
  ) {}

  public async init(): Promise<void> {
    console.log("Initializing the TokenUtil...");
    console.log("Initialized the TokenUtil!");
  }


  public async findIdOfAccessTokenInDirectory(
    tokenIntent: TokenIntent,
  ): Promise<string> {
    try {
      const accessToken = (await readdir(`./access-tokens/${tokenIntent}/`))[0];
      const idFromToken = accessToken.split(this.regExpToGetIdFromToken)[1];

      return idFromToken;
    } catch (e: unknown) {
      throw new Error(
        `Could not find an access token in the directory with intent \"${tokenIntent}\" :(`,
      );
    }
  }

  private areArrayEqual(array1: ReadonlyArray<string>, array2: ReadonlyArray<string>): boolean {
    return array1.length === array2.length &&
           array1.every(elem => array2.includes(elem));
  }

  public checkUseOfScope(scopes: string[]): TokenIntent | undefined {
    if(this.areArrayEqual(scopes, this.scopeForChat)) {
      return "chat";
    } else if(this.areArrayEqual(scopes, this.scopeForEvents)) {
      return "events";
    } else {
      return undefined;
    }
  }


  public async writeAccessTokenToDirectory(plainToken: AccessToken, tokenIntent: TokenIntent): Promise<void> {
    const encryptedToken: string = this.encryptPlainToken(plainToken);
    
    await writeFile(
      `./access-tokens/${tokenIntent}.txt`,
      encryptedToken,
      { encoding: "base64" }
    );
  } 

  public async readAccessTokenFromDirectory(
    userId: string,
    tokenIntent: TokenIntent,
  ): Promise<AccessToken> {
    return JSON.parse(
      await readFile(
        `./access-tokens/${tokenIntent}/accessToken-${userId}.json`,
        { encoding: "utf-8" },
      ),
    ) as AccessToken;
  }

  private encryptPlainToken(plainToken: string): String {
    const salt = randomBytes(this.PBKDF2_SALT_SIZE);
    const key: Buffer = pbkdf2Sync(Buffer.from(this.encryptionPassphrase, "utf8"), salt, this.PBKDF2_ITERATIONS, this.ALGORITHM_KEY_SIZE, this.PBKDF2_NAME);
    const iv: Buffer = randomBytes(this.ALGORITHM_NONCE_SIZE);

    const cipher: CipherGCM = createCipheriv(this.ALGORITHM_NAME, key, iv);

    const ciphertext = Buffer.concat([ cipher.update(Buffer.from(plainToken, "utf-8")), cipher.final() ]);

    const saltNonceCipertextAndTag = Buffer.concat([ salt, iv, ciphertext, cipher.getAuthTag()]);

    return saltNonceCipertextAndTag.toString("base64");
  }

  private decryptToken(encryptedToken: string): AccessToken {
    let saltNonceCipertextAndTag: Uint8Array = Buffer.from(encryptedToken, "base64");

    let salt: Uint8Array = saltNonceCipertextAndTag.slice(0, this.PBKDF2_SALT_SIZE);
    let ciphertextAndNonce: Uint8Array = saltNonceCipertextAndTag.slice(this.PBKDF2_SALT_SIZE);

    let key: Uint8Array = pbkdf2Sync(Buffer.from(this.encryptionPassphrase, "utf8"), salt, this.PBKDF2_ITERATIONS, this.ALGORITHM_KEY_SIZE, this.PBKDF2_NAME);


    let iv: Uint8Array = ciphertextAndNonce.slice(0, this.ALGORITHM_NONCE_SIZE);
    let ciphertext: Uint8Array = ciphertextAndNonce.slice(this.ALGORITHM_NONCE_SIZE, ciphertextAndNonce.length - this.ALGORITHM_TAG_SIZE);
    let tag: Uint8Array = ciphertextAndNonce.slice(ciphertext.length + this.ALGORITHM_NONCE_SIZE);

    let cipher: DecipherGCM = createDecipheriv(this.ALGORITHM_NAME, key, iv);

    cipher.setAuthTag(tag);
    return JSON.parse(Buffer.concat([ cipher.update(ciphertext), cipher.final() ]).toString("utf-8"));
  }

}
