import { AccessToken, RefreshingAuthProvider } from "@twurple/auth";
import { writeFile, readFile, readdir } from "fs/promises";
import ManageableClass from "./ManageableClass";

export default class AuthManager implements ManageableClass {
  private authProvider: RefreshingAuthProvider;

  constructor(private clientId: string, private clientSecret: string) {
    this.authProvider = new RefreshingAuthProvider({
      clientId,
      clientSecret,
    });
  }

  public async init() {
    const chatbotAccessToken = (await readdir("./secrets/chatbot/"))[0];

    if(!chatbotAccessToken) throw new Error("The chatbot's access token is missing :(");

    const chatbotId = chatbotAccessToken.split(/[-\\.]/)[1];

    await this.authProvider.addUserForToken(await this.fetchChatbotAccessToken(chatbotId), ["chatbot"])

    this.authProvider.onRefresh(
      async (userId: string, newTokenData: AccessToken) =>
        await writeFile(
          `./secrets/${chatbotId === userId ? "chatbot/" : ""}acccessToken-${userId}.json`,
          JSON.stringify(newTokenData, null, 4),
          { encoding: "utf-8" }
        )
    );
  }

  private async fetchChatbotAccessToken(chatbotId: string): Promise<AccessToken> {
    return JSON.parse(
      await readFile(
        `./secrets/chatbot/acccessToken-${chatbotId}.json`, 
        { encoding: "utf-8" }
      )
    ) as AccessToken;
  }

  public getAuthProvider(): RefreshingAuthProvider {
    return this.authProvider;
  }
}
