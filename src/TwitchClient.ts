import { ApiClient } from "@twurple/api";
import ManageableClass from "./ManageableClass";
import { RefreshingAuthProvider } from "@twurple/auth";
import { TokenIntent } from "./TokenUtil";

export default class TwitchClient implements ManageableClass {
  private apiClient: ApiClient;

  constructor(private readonly authProvider: RefreshingAuthProvider) {
    this.apiClient = new ApiClient({
      authProvider: this.authProvider,
    });
  }

  public getApiClient(): ApiClient {
    return this.apiClient;
  }

  async init(): Promise<void> {
    console.log("Initializing the TwitchClient...");
    console.log("Initialized the TwitchClient!");
  }

  public async getChatbotUsername(): Promise<string> {
    try {
      return this.apiClient.asIntent(["chat"], async (ctx) => {
        return (await ctx.getTokenInfo()).userName as string;
      });
    } catch (e: unknown) {
      throw new Error(
        "Could not get a username from the chatbot access token :/",
      );
    }
  }

  public async getIdFromAccessTokenForIntent(
    tokenIntent: TokenIntent,
  ): Promise<string> {
    try {
      return this.apiClient.asIntent([tokenIntent], async (ctx) => {
        return (await ctx.getTokenInfo()).userId as string;
      });
    } catch (e: unknown) {
      throw new Error(`Could not get id for intent \'${tokenIntent}\' :/`);
    }
  }
}
