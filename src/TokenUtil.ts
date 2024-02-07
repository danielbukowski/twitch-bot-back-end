import { HelixUser } from "@twurple/api";
import { AccessToken } from "@twurple/auth";
import axios from "axios";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

export default class TokenUtil {
  private readonly PATH_TO_TOKEN = "../authToken.json";
  private static instance: TokenUtil = new TokenUtil();

  public constructor(clientId: string) {
    this.clientId = clientId;
  }

  public static getInstance(): TokenUtil {
    return this.instance;
  }

  public readAccessTokenFromFile(): AccessToken {
    return JSON.parse(
      readFileSync(join(__dirname, this.PATH_TO_TOKEN), "utf-8")
    ) as AccessToken;
  }

  public writeAccessTokenToFile(accessToken: AccessToken) {
    writeFileSync(
      join(__dirname, this.PATH_TO_TOKEN),
      JSON.stringify(accessToken)
    );
  }
  public async getUsernameByAccessToken(accessToken: AccessToken): Promise<string> {
    const userInfo = await axios.get<{ data: HelixUser[] }>(
      "https://api.twitch.tv/helix/users",
      {
        headers: {
          "Client-Id": this.clientId,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
    return userInfo.data.data[0].displayName.toLowerCase();
  }
}
