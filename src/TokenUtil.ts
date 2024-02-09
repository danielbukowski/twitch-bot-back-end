import { AccessToken } from "@twurple/auth";
import axios from "axios";
import ManageableClass from "./ManageableClass";

interface TwitchUser {
  id: string;
  login: string;
  display_name: string;
  type: string;
  broadcaster_type: string;
  description: string;
  profile_image_url: string;
  offline_image_url: string;
  view_count: number;
  email: string;
  created_at: string;
}

export default class TokenUtil implements ManageableClass{
  private clientId: string;

  public constructor(clientId: string) {
    this.clientId = clientId;
  }
  
  async init(): Promise<void> {
    console.log("Initializing the TokenUtil...");
    console.log("Initialized the TokenUtil!");
  }

  public async getUsernameByAccessToken(accessToken: AccessToken): Promise<string | undefined> {
    const userInfo = await axios.get<{ data: TwitchUser[] }>(
      "https://api.twitch.tv/helix/users",
      {
        headers: {
          "Client-Id": this.clientId,
          Authorization: `Bearer ${accessToken.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    ).catch(() => { return undefined });

    return userInfo?.data.data[0].display_name.toLowerCase();
  }
}
