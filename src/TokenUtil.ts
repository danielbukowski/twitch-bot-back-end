import { AccessToken, exchangeCode } from "@twurple/auth";
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

  public constructor(
    private readonly clientId: string, 
    private readonly clientSecret: string,
    private readonly oauthRedirectUri: string,
    private readonly encryptionPassphrase: string
  ) {}

  public async init(): Promise<void> {
    console.log("Initializing the TokenUtil...");
    console.log("Initialized the TokenUtil!");
  }

  public async exchangeCodeToAccessToken(code: string): Promise<AccessToken> {
    return await exchangeCode(this.clientId, this.clientSecret, code, this.oauthRedirectUri);
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

  public async writeAccessTokenToDirectory(plainToken: AccessToken, userId: string, tokenIntent: TokenIntent): Promise<void> {
    const encryptedToken: string = this.encryptPlainToken(plainToken);
    
    await writeFile(
      `./access-tokens/${tokenIntent}/accessToken-${userId}.txt`,
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
