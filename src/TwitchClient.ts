import { ApiClient } from "@twurple/api";
import ManageableClass from "./ManageableClass";
import { RefreshingAuthProvider } from "@twurple/auth";

export default class TwitchClient implements ManageableClass  {
    private apiClient!: ApiClient;

    constructor(private authProvider: RefreshingAuthProvider) {
        this.apiClient = new ApiClient({
            authProvider: this.authProvider
        });
    }

    async init(): Promise<void> {
        console.log("Initializing the TwitchClient...");
        console.log("Initialized the TwitchClient...");
    }

    public getApiClient(): ApiClient {
        return this.apiClient;
    }
    
    public async getChatbotUsername(): Promise<string | undefined> {
        return this.apiClient.asIntent(["chat"], async (ctx) => {
            return (await ctx.getTokenInfo()).userName ?? undefined;
        });
    }
}