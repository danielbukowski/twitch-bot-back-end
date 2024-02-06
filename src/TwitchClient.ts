import dotenv from "dotenv";
dotenv.config();
import {
  AccessToken,
  StaticAuthProvider,
  refreshUserToken,
} from "@twurple/auth";
import { ChatClient, ChatMessage } from "@twurple/chat";
import TokenUtil from "./TokenUtil";

export default class TwitchClient {
  private static instance: TwitchClient = new TwitchClient();
  private readonly TWITCH_CLIENT_ID: string = process.env.TWITCH_CLIENT_ID || "";
  private readonly TWITCH_CLIENT_SECRET: string = process.env.TWITCH_CLIENT_SECRET || "";
  private readonly TWITCH_CHANNEL: string = process.env.TWITCH_CHANNEL || "";
  private readonly TWITCH_BOT_NAME: string = process.env.TWITCH_BOT_NAME || "";
  private readonly COMMAND_PREFIX: string = "!";
  private tokenUtil: TokenUtil = TokenUtil.getInstance();
  private chatClient!: ChatClient;

  private constructor() {
    this.chatClient = new ChatClient({
      authProvider: new StaticAuthProvider(
        this.TWITCH_CLIENT_ID,
        this.tokenUtil.readAccessTokenFromFile()
      ),
      channels: [this.TWITCH_CHANNEL],
      webSocket: true,
    });

    this.setChatClientListeners();
    this.chatClient.connect();
  }

  public static getInstance(): TwitchClient {
    return this.instance;
  }

  private setChatClientListeners(): void {
    this.chatClient.onTokenFetchFailure(async () => {
      const newAccessToken: AccessToken = await refreshUserToken(
        this.TWITCH_CLIENT_ID,
        this.TWITCH_CLIENT_SECRET,
        this.tokenUtil.readAccessTokenFromFile().refreshToken as string
      );
      this.tokenUtil.writeAccessTokenToFile(newAccessToken);
      console.log("The token has been refreshed");
      this.chatClient.quit();
    });

    this.chatClient.onDisconnect(() => {
      console.log("I have been disconnected from the chat :(");
    })

    this.chatClient.onConnect(() => {
      console.log("I have connected to the chat! :)");
      this.chatClient.say(this.TWITCH_CHANNEL,"I have connected to the chat! :)");
    });

    this.chatClient.onMessage(async (channel: string, user: string, text: string, msg: ChatMessage) => {
        text = text.trim().toLowerCase();

        if (!text.startsWith(this.COMMAND_PREFIX) ||user === this.TWITCH_BOT_NAME) return;

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
}
