import { AccessToken, RefreshingAuthProvider } from "@twurple/auth";
import { writeFile } from "fs/promises";
import { ManageableClass } from "./ObjectManager";
import TokenUtil, { TokenIntent } from "./TokenUtil";

export default class AuthManager implements ManageableClass {
  private authProvider: RefreshingAuthProvider;

  constructor(
    private readonly clientId: string,
    private readonly clientSecret: string,
    private readonly tokenUtil: TokenUtil,
  ) {
    this.authProvider = new RefreshingAuthProvider({
      clientId,
      clientSecret,
    });
  }

  public getAuthProvider(): RefreshingAuthProvider {
    return this.authProvider;
  }

  public async init(): Promise<void> {
    console.log("Initializing the AuthManager...");

    await this.initTokenForIntent("chat");
    await this.initTokenForIntent("events");

    const idOfAccessTokenForChat: string =
      await this.tokenUtil.findIdOfAccessTokenInDirectory("chat");

    this.authProvider.onRefresh(
      async (userId: string, newTokenData: AccessToken) =>
        await writeFile(
          `./access-tokens/${idOfAccessTokenForChat === userId ? "chat" : "events"}accessToken-${userId}.json`,
          JSON.stringify(newTokenData, null, 4),
          { encoding: "utf-8" },
        ),
    );

    console.log("Initialized the AuthManager!");
  }

  private async initTokenForIntent(tokenIntent: TokenIntent): Promise<void> {
    const accessTokenIdForIntent: string =
      await this.tokenUtil.findIdOfAccessTokenInDirectory(tokenIntent);
    const accessTokenForIntent: AccessToken =
      await this.tokenUtil.readAccessTokenFromDirectory(
        accessTokenIdForIntent,
        tokenIntent,
      );
    await this.authProvider.addUserForToken(accessTokenForIntent, [
      tokenIntent,
    ]);
  }
}
