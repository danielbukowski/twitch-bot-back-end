import dotenv from "dotenv";
dotenv.config();

interface Config {
  readonly twitchAppClientId: string;
  readonly twitchAppClientSecret: string;
  readonly httpServerPort: string;
  readonly youtubeApiKey: string;
  readonly twitchChannel: string;
  readonly encryptionKey: string;
}

export type UserRole = "Mod" | "Subscriber" | "Vip" | "Broadcaster" | "Artist" | "Founder";

export default class ConfigInitializer {
  private config: Config;

  constructor() {
    this.config = {
      twitchAppClientId: process.env.TWITCH_CLIENT_ID || "",
      twitchAppClientSecret: process.env.TWITCH_CLIENT_SECRET || "",
      httpServerPort: process.env.HTTP_SERVER_PORT || "",
      youtubeApiKey: process.env.YOUTUBE_API_KEY || "",
      twitchChannel: process.env.TWITCH_CHANNEL || "",
      encryptionKey: process.env.ENCRYPTION_KEY || "",
    };
  }

  public getConfig(): Config {
    return this.config;
  }

  public checkConfigurationVariables(): void {
    console.log("Checking configuration variables...");

    for (const key in this.config) {
      const value = this.config[key as keyof Config];
      if (!value)
        throw new Error(
          `The ${key as keyof Config} enviroment variable is not set :C`,
        );
    }

    console.log("The configuration variables are checked!");
  }
}
