import { type AccessToken, RefreshingAuthProvider } from "@twurple/auth";
import type { Initializable } from "./ObjectManager";
import type TokenStorageFactory from "./TokenStorageFactory";
import TokenUtil from "./TokenUtil";
import type { TokenIntent } from "./TokenUtil";

export interface TokenStorage {
	getAllAccessTokens(): Promise<
		Array<{ tokenIntent: TokenIntent; accessToken: AccessToken }>
	>;
	saveAccessToken(
		tokenIntent: TokenIntent,
		accessToken: AccessToken,
	): Promise<void>;
}

export default class AuthManager implements Initializable {
	private authProvider: RefreshingAuthProvider;

	constructor(
		private readonly clientId: string,
		private readonly clientSecret: string,
		private readonly tokenUtil: TokenUtil,
		private readonly tokenStorageFactory: TokenStorageFactory,
	) {
		this.authProvider = new RefreshingAuthProvider({
			clientId,
			clientSecret,
		});
	}

	public getAuthProvider(): RefreshingAuthProvider {
		return this.authProvider;
	}

	public async init(): Promise<void> {
		console.log("Initializing the AuthManager...");

		const tokenStorage = this.tokenStorageFactory.getTokenStorage();

		const tokens: {
			tokenIntent: TokenIntent;
			accessToken: AccessToken;
		}[] = await tokenStorage.getAllAccessTokens();

		for (const token of tokens) {
			await this.authProvider.addUserForToken(token.accessToken, [
				token.tokenIntent,
			]);
		}

		this.authProvider.onRefresh(
			async (userId: string, newToken: AccessToken) => {
				const scopesOfNewToken = newToken.scope;

				const tokenIntent: TokenIntent | undefined =
					TokenUtil.checkUseOfScopes(scopesOfNewToken);

				if (!tokenIntent) {
					throw new Error("An error occured when refreshing an access token");
				}

				tokenStorage.saveAccessToken(tokenIntent, newToken);
			},
		);

		console.log("Initialized the AuthManager!");
	}
}
