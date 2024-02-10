import axios from "axios";
import ManageableClass from "./ManageableClass";

export default class YoutubeClient implements ManageableClass{
  private readonly youtubeApiKey: string;

  constructor(youtubeApikey: string) {
    this.youtubeApiKey = youtubeApikey;
  }
  async init(): Promise<void> {
    console.log("Initializing the YoutubeClient...");
    console.log("Initialized the YoutubeClient...");
  }

}
