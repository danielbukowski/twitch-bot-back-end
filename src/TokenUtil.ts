import {
	type CipherGCM,
	type CipherGCMTypes,
	type DecipherGCM,
	createCipheriv,
	createDecipheriv,
	pbkdf2Sync,
	randomBytes,
} from "node:crypto";
import type { AccessToken } from "@twurple/auth";
import type { Initializable } from "./ObjectManager";
import * as Logger from "./Logger";

export type TokenIntent = "events" | "chat";

export default class TokenUtil implements Initializable {
	private readonly ALGORITHM_NAME: CipherGCMTypes = "aes-128-gcm";
	private readonly ALGORITHM_NONCE_SIZE: number = 12;
	private readonly ALGORITHM_TAG_SIZE: number = 16;
	private readonly ALGORITHM_KEY_SIZE: number = 16;
	private readonly PBKDF2_NAME: string = "sha256";
	private readonly PBKDF2_SALT_SIZE: number = 18;
	private readonly PBKDF2_ITERATIONS: number = 33217;

	private static readonly scopesForChat: ReadonlyArray<string> = [
		"chat:edit",
		"chat:read",
	];
	private static readonly scopesForEvents: ReadonlyArray<string> = [
		"moderator:read:followers",
		"channel:read:subscriptions",
	];

	public constructor(private readonly encryptionPassphrase: string) {}

	public async init(): Promise<void> {
		Logger.info(`Initializing the ${this.constructor.name}...`);
		Logger.info(`Initialized the ${this.constructor.name}!`);
	}

	private static areArrayEqual(
		array1: ReadonlyArray<string>,
		array2: ReadonlyArray<string>,
	): boolean {
		return (
			array1.length === array2.length &&
			array1.every((elem) => array2.includes(elem))
		);
	}

	public static checkUseOfScopes(scopes: string[]): TokenIntent | undefined {
		if (TokenUtil.areArrayEqual(scopes, TokenUtil.scopesForChat)) {
			return "chat";
		}
		if (TokenUtil.areArrayEqual(scopes, TokenUtil.scopesForEvents)) {
			return "events";
		}
		return undefined;
	}

	public encryptPlainToken(plainToken: AccessToken): string {
		const salt: Uint8Array = randomBytes(this.PBKDF2_SALT_SIZE);
		const key: Uint8Array = pbkdf2Sync(
			Buffer.from(this.encryptionPassphrase, "utf-8"),
			salt,
			this.PBKDF2_ITERATIONS,
			this.ALGORITHM_KEY_SIZE,
			this.PBKDF2_NAME,
		);
		const iv: Uint8Array = randomBytes(this.ALGORITHM_NONCE_SIZE);

		const cipher: CipherGCM = createCipheriv(this.ALGORITHM_NAME, key, iv);

		const ciphertext: Uint8Array = Buffer.concat([
			cipher.update(Buffer.from(JSON.stringify(plainToken), "utf-8")),
			cipher.final(),
		]);

		const saltNonceCipertextAndTag: Buffer = Buffer.concat([
			salt,
			iv,
			ciphertext,
			cipher.getAuthTag(),
		]);

		return saltNonceCipertextAndTag.toString("base64");
	}

	public decryptToken(encryptedToken: string): AccessToken {
		const saltNonceCipertextAndTag: Uint8Array = Buffer.from(
			encryptedToken,
			"base64",
		);

		const salt: Uint8Array = saltNonceCipertextAndTag.slice(
			0,
			this.PBKDF2_SALT_SIZE,
		);
		const ciphertextAndNonce: Uint8Array = saltNonceCipertextAndTag.slice(
			this.PBKDF2_SALT_SIZE,
		);

		const key: Uint8Array = pbkdf2Sync(
			Buffer.from(this.encryptionPassphrase, "utf8"),
			salt,
			this.PBKDF2_ITERATIONS,
			this.ALGORITHM_KEY_SIZE,
			this.PBKDF2_NAME,
		);

		const iv: Uint8Array = ciphertextAndNonce.slice(
			0,
			this.ALGORITHM_NONCE_SIZE,
		);
		const ciphertext: Uint8Array = ciphertextAndNonce.slice(
			this.ALGORITHM_NONCE_SIZE,
			ciphertextAndNonce.length - this.ALGORITHM_TAG_SIZE,
		);
		const tag: Uint8Array = ciphertextAndNonce.slice(
			ciphertext.length + this.ALGORITHM_NONCE_SIZE,
		);

		const cipher: DecipherGCM = createDecipheriv(this.ALGORITHM_NAME, key, iv);

		cipher.setAuthTag(tag);
		return JSON.parse(
			Buffer.concat([cipher.update(ciphertext), cipher.final()]).toString(
				"utf-8",
			),
		);
	}
}
