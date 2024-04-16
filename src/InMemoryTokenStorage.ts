import { AccessToken } from "@twurple/auth";
import { TokenStorage } from "./AuthManager";
import TokenUtil, { TokenIntent } from "./TokenUtil";
import { readFile, writeFile, readdir } from "fs/promises";

export default class InMemoryTokenStorage implements TokenStorage {
	private readonly DIRECTORY_PATH_TO_TOKENS = "./access-tokens";

	constructor(private readonly tokenUtil: TokenUtil) {}

	public async getAllAccessTokens(): Promise<
		{ tokenIntent: TokenIntent; accessToken: AccessToken }[]
	> {
		const tokens: { tokenIntent: TokenIntent; accessToken: AccessToken }[] = [];

		const files = await readdir(this.DIRECTORY_PATH_TO_TOKENS);

		for await (const fileName of files) {
			const tokenIntent: string | undefined = fileName.split(".")[0];

			if (
				!tokenIntent &&
				(tokenIntent === "chat" || tokenIntent === "events")
			) {
				continue;
			}

			const encryptedToken: string = await readFile(
				`./access-tokens/${fileName}`,
				{ encoding: "utf-8" },
			);

			const decryptedToken: AccessToken =
				this.tokenUtil.decryptToken(encryptedToken);

			tokens.push({
				tokenIntent: tokenIntent as TokenIntent,
				accessToken: decryptedToken,
			});
		}

		return tokens;
	}
	public async saveAccessToken(
		tokenIntent: TokenIntent,
		accessToken: AccessToken,
	): Promise<void> {
		const encryptedToken = this.tokenUtil.encryptPlainToken(accessToken);

		await writeFile(
			`${this.DIRECTORY_PATH_TO_TOKENS}/${tokenIntent}.txt`,
			encryptedToken,
			{ encoding: "utf-8" },
		);
	}
}
