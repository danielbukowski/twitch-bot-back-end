import { ApiClient } from "@twurple/api";
import {
	type AccessToken,
	type RefreshingAuthProvider,
	exchangeCode,
} from "@twurple/auth";
import type { Initializable } from "./ObjectManager";
import * as Logger from "./Logger";

export default class TwitchClient implements Initializable {
	private apiClient: ApiClient;

	constructor(
		private readonly authProvider: RefreshingAuthProvider,
		private readonly clientId: string,
		private readonly clientSecret: string,
		private readonly oauth2RedirectUri: string,
	) {
		this.apiClient = new ApiClient({
			authProvider: this.authProvider,
		});
	}

	public getApiClient(): ApiClient {
		return this.apiClient;
	}

	public async init(): Promise<void> {
		Logger.info(`Initializing the ${this.constructor.name}...`);
		Logger.info(`Initialized the ${this.constructor.name}!`);
	}

	public async exchangeCodeToAccessToken(code: string): Promise<AccessToken> {
		return await exchangeCode(
			this.clientId,
			this.clientSecret,
			code,
			this.oauth2RedirectUri,
		);
	}
}
