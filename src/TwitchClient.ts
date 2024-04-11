import { ApiClient } from "@twurple/api";
import { Initializable } from "./ObjectManager";
import { RefreshingAuthProvider } from "@twurple/auth";
import { TokenIntent } from "./TokenUtil";

export default class TwitchClient implements Initializable {
  private apiClient: ApiClient;

  constructor(
    private readonly authProvider: RefreshingAuthProvider,
    private readonly clientId: string, 
    private readonly clientSecret: string,
    private readonly oauth2RedirectUri: string,) {
    this.apiClient = new ApiClient({
      authProvider: this.authProvider,
    });
  }

  public getApiClient(): ApiClient {
    return this.apiClient;
  }

  public async init(): Promise<void> {
    console.log("Initializing the TwitchClient...");
    console.log("Initialized the TwitchClient!");
  }

  public async exchangeCodeToAccessToken(code: string): Promise<AccessToken> {
    return await exchangeCode(this.clientId, this.clientSecret, code, this.oauth2RedirectUri);
  }

  public async getChatbotName(): Promise<string | undefined> {
    try {
      return this.apiClient.asIntent(["chat"], async (ctx) => {
        return (await ctx.getTokenInfo()).userName as string;
      });
    } catch (e: unknown) {
      return undefined;
    }
  }
}
