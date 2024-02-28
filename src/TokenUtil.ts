import { AccessToken } from "@twurple/auth";
import ManageableClass from "./ManageableClass";
import { readFile, readdir } from "fs/promises";

export type TokenIntent = "events" | "chat";


export default class TokenUtil implements ManageableClass {
  private readonly regexToGetIdFromToken: RegExp = /[-\\.]/;

  public constructor(private readonly clientId: string) { }
  
  async init(): Promise<void> {
    console.log("Initializing the TokenUtil...");
    console.log("Initialized the TokenUtil!");
  }
  
  public async findIdOfAccessTokenInDirectory(tokenIntent: TokenIntent): Promise<string> {
    try {
      const accessToken = (await readdir(`./access-tokens/${tokenIntent}/`))[0];
      const idFromToken = accessToken.split(this.regexToGetIdFromToken)[1];

      return idFromToken;
    } catch (e: unknown) {
      throw new Error(`Could not find an access token in the directory with intent \"${tokenIntent}\" :(`);
    }
  }

  public async readAccessTokenFromDirectory(userId: string, tokenIntent: TokenIntent): Promise<AccessToken> {
    return JSON.parse(
      await readFile(
        `./access-tokens/${tokenIntent}/accessToken-${userId}.json`, 
        { encoding: "utf-8" }
      )
    ) as AccessToken;
  }
}