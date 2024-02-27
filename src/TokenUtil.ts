import { AccessToken } from "@twurple/auth";
import axios from "axios";
import ManageableClass from "./ManageableClass";


export default class TokenUtil implements ManageableClass {

  public constructor(private readonly clientId: string) { }
  
  async init(): Promise<void> {
    console.log("Initializing the TokenUtil...");
    console.log("Initialized the TokenUtil!");
  }
}