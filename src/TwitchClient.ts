import { ApiClient } from "@twurple/api";
import ManageableClass from "./ManageableClass";
import { RefreshingAuthProvider } from "@twurple/auth";

export default class TwitchClient implements ManageableClass  {
    private apiClient: ApiClient;

    constructor(private readonly authProvider: RefreshingAuthProvider) {
        this.apiClient = new ApiClient({
            authProvider: this.authProvider
        });
    }

    async init(): Promise<void> {
        console.log("Initializing the TwitchClient...");
        console.log("Initialized the TwitchClient!");
    }

    public getApiClient(): ApiClient {
        return this.apiClient;
    }
    
    public async getChatbotUsername(): Promise<string> {
        try {
            return this.apiClient.asIntent(["chat"], async (ctx) => {
                return (await ctx.getTokenInfo()).userName as string;
            });
        } catch (e: unknown) {
            throw new Error("Could not get a username from the chatbot's access token :/");
        }
    }
}