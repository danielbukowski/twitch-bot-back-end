import axios from "axios";
import ManageableClass from "./ManageableClass";

export default class YoutubeClient implements ManageableClass {
  private readonly youtubeApiKey: string;

  constructor(youtubeApikey: string) {
    this.youtubeApiKey = youtubeApikey;
  }
  async init(): Promise<void> {
    console.log("Initializing the YoutubeClient...");
    console.log("Initialized the YoutubeClient...");
  }

  async getVideoIdByName(name: string): Promise<string> {
    return await axios
      .get<{
        items: [
          {
            id: {
              videoId: string;
            };
          }
        ];
      }>("https://youtube.googleapis.com/youtube/v3/search", {
        params: {
          maxResults: 1,
          part: "id",
          fields: "items/id/videoId",
          q: name,
          key: this.youtubeApiKey,
        },
      })
      .then((response) => response.data.items[0].id.videoId);
  }

  async getVideoDetailsById(videoId: string) {
    return await axios.get<{
      items: [
        snippet: {
          title: string
        },
        contentDetails: {
          duration: string
        },
        statistics: {
          viewCount: string
        }
      ]
    }>("https://www.googleapis.com/youtube/v3/videos", {
      params: { 
        id: videoId,   
        key: this.youtubeApiKey,
        fields: "items(snippet/title,contentDetails/duration,statistics/viewCount)",
        part: "snippet,contentDetails,statistics",
      },
    });
  }
}
