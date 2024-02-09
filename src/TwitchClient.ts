import { AccessToken, RefreshingAuthProvider } from "@twurple/auth";
import { ChatClient, ChatMessage } from "@twurple/chat";
import ManageableClass from "./ManageableClass";
import TokenUtil from "./TokenUtil";

export default class TwitchClient implements ManageableClass{
  private readonly COMMAND_PREFIX: string = "!";
  private chatClient!: ChatClient;
  private botName: string | undefined;
  private authProvider: RefreshingAuthProvider;
  private tokenUtil: TokenUtil;

  public constructor(authProvider: RefreshingAuthProvider, tokenUtil: TokenUtil) {
    this.authProvider = authProvider;
    this.tokenUtil = tokenUtil;
    this.chatClient = new ChatClient({
      authProvider: authProvider,
      channels: [],
      webSocket: true,
      authIntents: ["chatbot"]
    });
  }

  public async init(): Promise<void> {
    console.log("Initializing the TwitchClient...");
    
    this.botName = await this.tokenUtil.getUsernameByAccessToken((await this.authProvider.getAccessTokenForIntent("chatbot")) as AccessToken);

    if(this.botName === undefined) throw new Error("Could not fetch a chatbot's info")

    this.setChatClientListeners();
    this.chatClient.connect();
    console.log("Initilized the TwitchClient!");
  }

  private setChatClientListeners(): void {
    this.chatClient.onDisconnect(() => {
      console.log("I have been disconnected from the chat :(");
    })

    this.chatClient.onJoin((channel: string, user: string) => {
      console.log("I have connected to the chat! :)");
      this.chatClient.say(channel, "I have connected to the chat! :)");
    })

    this.chatClient.onMessage(async (channel: string, user: string, text: string, msg: ChatMessage) => {
        text = text.trim().toLowerCase();        

        if (!text.startsWith(this.COMMAND_PREFIX) || user === this.botName) return;

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
