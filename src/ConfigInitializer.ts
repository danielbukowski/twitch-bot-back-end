import dotenv from "dotenv";
import Logger from "./Logger";
dotenv.config();

interface EnvironmentVariables {
	TWITCH_APP_CLIENT_ID: string;
	TWITCH_APP_CLIENT_SECRET: string;
	HTTP_SERVER_PORT: string;
	YOUTUBE_API_KEY: string;
	ENCRYPTION_PASSPHRASE: string;
	OAUTH2_REDIRECT_URI: string;
	FRONTEND_ORIGIN: string;
}

export type UserType =
	| "Mod"
	| "Subscriber"
	| "Vip"
	| "Broadcaster"
	| "Artist"
	| "Founder";

export default class ConfigInitializer {
	private environmentVariables: Readonly<EnvironmentVariables>;

	constructor() {
		this.environmentVariables = {
			TWITCH_APP_CLIENT_ID: process.env.TWITCH_APP_CLIENT_ID || "",
			TWITCH_APP_CLIENT_SECRET: process.env.TWITCH_APP_CLIENT_SECRET || "",
			HTTP_SERVER_PORT: process.env.HTTP_SERVER_PORT || "",
			YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY || "",
			ENCRYPTION_PASSPHRASE: process.env.ENCRYPTION_PASSPHRASE || "",
			OAUTH2_REDIRECT_URI: process.env.OAUTH2_REDIRECT_URI || "",
			FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || "",
		};
	}

	public getEnvironmentVariables(): EnvironmentVariables {
		return this.environmentVariables;
	}

	public checkEnvironmentVariables(): void {
		Logger.info("Checking the environment variables...");

		for (const key in this.environmentVariables) {
			const value =
				this.environmentVariables[key as keyof EnvironmentVariables];
			if (!value)
				throw new Error(
					`The ${
						key as keyof EnvironmentVariables
					} environment variable is not set :C`,
				);
		}

		Logger.info("The environment variables are checked!");
	}
}
