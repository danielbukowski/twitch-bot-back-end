import { AccessToken } from "@twurple/auth";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

export default class TokenUtil {
  private readonly PATH_TO_TOKEN = "../authToken.json";
  private static instance: TokenUtil = new TokenUtil();

  private constructor() {}

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
}
