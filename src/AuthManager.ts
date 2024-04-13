import { AccessToken, RefreshingAuthProvider } from "@twurple/auth";
import { Initializable } from "./ObjectManager";
import TokenUtil, { TokenIntent } from "./TokenUtil";

export interface TokenStorage {
  getAllAccessTokens(): Promise<Array<{tokenIntent: TokenIntent, accessToken: AccessToken}>>;
  saveAccessToken(tokenIntent: TokenIntent, accessToken: AccessToken): Promise<void>;
}

export default class AuthManager implements Initializable {
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

    this.authProvider.onRefresh(
      async (userId: string, newToken: AccessToken) => {
        const scopesOfNewToken = newToken.scope;

        const tokenIntent: TokenIntent | undefined = this.tokenUtil.checkUseOfScopes(scopesOfNewToken);

        if(!tokenIntent) {
          throw new Error("An error occured when refreshing an access token");
        }
       }
     );
  
    console.log("Initialized the AuthManager!");
  }
}
