import type { TokenStorage } from "./AuthManager";
import InMemoryTokenStorage from "./InMemoryTokenStorage";
import * as Logger from "./Logger";
import type { Initializable } from "./ObjectManager";
import type TokenUtil from "./TokenUtil";

export default class TokenStorageFactory implements Initializable {
	private tokenStorage!: TokenStorage;

	constructor(
		private readonly tokenStorageType: string,
		private readonly tokenUtil: TokenUtil,
	) {}

	public getTokenStorage(): TokenStorage {
		return this.tokenStorage;
	}

	public async init(): Promise<void> {
		Logger.info(`Initializing the ${this.constructor.name}...`);

		switch (this.tokenStorageType) {
			case "IN_MEMORY":
				this.tokenStorage = new InMemoryTokenStorage(this.tokenUtil);
				break;
			default:
				throw new Error(
					`Unknown token storage type has been provided -> '${this.tokenStorageType}'`,
				);
		}

		Logger.info(`Initialized the ${this.constructor.name}!`);
	}
}
