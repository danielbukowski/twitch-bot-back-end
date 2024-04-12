import dotenv from "dotenv";
dotenv.config();

interface Config {
  twitchAppClientId: string;
  twitchAppClientSecret: string;
  httpServerPort: string;
  youtubeApiKey: string;
  twitchChannel: string;
  encryptionPassphrase: string;
  oauth2RedirectUri: string;
  frontendOrigin: string;
}

export type UserRole = "Mod" | "Subscriber" | "Vip" | "Broadcaster" | "Artist" | "Founder";

export default class ConfigInitializer {
  private config: Readonly<Config>;

  constructor() {
    this.config = {
      twitchAppClientId: process.env.TWITCH_CLIENT_ID || "",
      twitchAppClientSecret: process.env.TWITCH_CLIENT_SECRET || "",
      httpServerPort: process.env.HTTP_SERVER_PORT || "",
      youtubeApiKey: process.env.YOUTUBE_API_KEY || "",
      twitchChannel: process.env.TWITCH_CHANNEL || "",
      encryptionPassphrase: process.env.ENCRYPTION_PASSPHRASE || "",
      oauth2RedirectUri: process.env.OAUTH2_REDIRECT_URI || "",
      frontendOrigin: process.env.FRONTEND_ORIGIN || ""
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
          `The ${key as keyof Config} environment variable is not set :C`,
        );
    }

    console.log("The configuration variables are checked!");
  }
}
