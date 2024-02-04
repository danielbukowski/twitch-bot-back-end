import dotenv from "dotenv";
dotenv.config();
import {
  AccessToken,
  AuthProvider,
  StaticAuthProvider,
} from "@twurple/auth";
import { ChatClient, ChatMessage } from "@twurple/chat";
import { readFileSync } from "fs";
import { join } from "path";

export default class TwitchClient {
  private static instance: TwitchClient = new TwitchClient();
  private readonly TWITCH_CLIENT_ID: string = process.env.TWITCH_CLIENT_ID || "";
  private readonly TWITCH_CHANNEL: string = process.env.TWITCH_CHANNEL || "";
  private readonly TWITCH_BOT_NAME: string = process.env.TWITCH_BOT_NAME || "";
  private readonly COMMAND_PREFIX: string = "!";
  private chatClient: ChatClient;
  private authProvider: AuthProvider;
  private accessToken: AccessToken;

  private constructor() {
    this.accessToken = this.readAccessTokenFromFile();
    this.authProvider = new StaticAuthProvider(
      this.TWITCH_CLIENT_ID,
      this.accessToken
    );

    this.chatClient = new ChatClient({
      authProvider: this.authProvider,
      channels: [this.TWITCH_CHANNEL],
      webSocket: true,
    });
    
    this.setMessageListenerBehavior();

    this.chatClient.onConnect(() => {
      this.chatClient.say(
        this.TWITCH_CHANNEL,
        "I have connected to the chat! :)"
      );
    });

    this.chatClient.connect();
  }

  public static getInstance(): TwitchClient {
    return this.instance;
  }

  private setMessageListenerBehavior(): void {
    this.chatClient.onMessage(async (channel: string, user: string, text: string, msg: ChatMessage) => {
        text = text.trim().toLowerCase();

        if (!text.startsWith(this.COMMAND_PREFIX) || user === this.TWITCH_BOT_NAME) return;

        const [commandName, ...commandParameters] = text.split(" ");

        switch (commandName) {
          case `${this.COMMAND_PREFIX}hello`:
            this.chatClient.say(channel, `Hello @${user}`);
            break;
          default:
            break;
        }
      }
    );
  }

  private readAccessTokenFromFile(): AccessToken {
    return JSON.parse(
      readFileSync(join(__dirname, "../authToken.json"), "utf-8")
    ) as AccessToken;
  }
}
