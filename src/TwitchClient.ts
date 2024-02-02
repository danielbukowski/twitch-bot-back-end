import dotenv from "dotenv";
dotenv.config();
import { AccessToken, StaticAuthProvider } from "@twurple/auth";
import { ChatClient } from "@twurple/chat";
import { readFileSync } from "fs";
import { join } from "path";

export default class TwitchClient {
  private static instance: TwitchClient = new TwitchClient();
  private readonly clientId: string = process.env.TWITCH_CLIENT_ID || "";
  private readonly twitchChannel = process.env.TWITCH_CHANNEL || "";
  private chat!: ChatClient;

  private constructor() {
    this.init();
  }

  private async init(): Promise<void> {
    this.chat = new ChatClient({
      authProvider: new StaticAuthProvider(
        this.clientId,
        JSON.parse(
          readFileSync(join(__dirname, "./secrets/authToken.json"), "utf-8")
        ) as AccessToken
      ),
      channels: [this.twitchChannel],
      webSocket: true,
    });

    this.chat.onConnect(() => {
      this.chat.say(this.twitchChannel, "I have connected to the channel! :)");
    });

    this.chat.connect();
  }

  public static getInstance(): TwitchClient {
    return this.instance;
  }
}
