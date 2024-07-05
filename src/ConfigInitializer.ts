import * as Logger from "./Logger";
import * as z from "zod";

const ENVIRONMENT_VARIABLES_SCHEMA = z.object({
	TWITCH_APP_CLIENT_ID: z.string(),
	TWITCH_APP_CLIENT_SECRET: z.string(),
	HTTP_SERVER_PORT: z.string(),
	YOUTUBE_API_KEY: z.string(),
	ENCRYPTION_PASSPHRASE: z.string(),
	OAUTH2_REDIRECT_URI: z.string(),
	FRONTEND_ORIGIN: z.string(),
});

export default class ConfigInitializer {
	private environmentVariables!: z.infer<typeof ENVIRONMENT_VARIABLES_SCHEMA>;

	public getEnvironmentVariables(): z.infer<
		typeof ENVIRONMENT_VARIABLES_SCHEMA
	> {
		return this.environmentVariables;
	}

	public checkEnvironmentVariables(): void {
		Logger.info("Checking the environment variables...");

		const parsedEnvironmentVariables = ENVIRONMENT_VARIABLES_SCHEMA.safeParse(
			process.env,
		);

		if (parsedEnvironmentVariables.error) {
			Logger.error(parsedEnvironmentVariables.error);
			throw new Error("Failed to parse the environment variables");
		}

		this.environmentVariables = parsedEnvironmentVariables.data;

		Logger.info("The environment variables are checked!");
	}
}
