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

export default class TokenUtil implements ManageableClass {

  public constructor(private clientId: string) { }
  
  async init(): Promise<void> {
    console.log("Initializing the TokenUtil...");
    console.log("Initialized the TokenUtil!");
  }
}