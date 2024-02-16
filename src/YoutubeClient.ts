import axios from "axios";
import ManageableClass from "./ManageableClass";

export interface VideoDetails {
  snippet: {
    title: string;
  };
  contentDetails: {
    duration: string;
  };
  statistics: {
    viewCount: string;
  };
}

export default class YoutubeClient implements ManageableClass {
  private readonly youtubeApiKey: string;

  constructor(youtubeApikey: string) {
    this.youtubeApiKey = youtubeApikey;
  }

  async init(): Promise<void> {
    console.log("Initializing the YoutubeClient...");
    console.log("Initialized the YoutubeClient...");
  }

  async getVideoIdByName(name: string): Promise<string | undefined> {
      try {
        const response = await axios
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
        });
        return response.data.items[0].id.videoId;
      } catch (error) {
        return undefined
      }
  }

  async getVideoDetailsById(videoId: string): Promise<VideoDetails | undefined> {
    try {
      const response = await axios.get<{ items: VideoDetails[] }>(
        "https://www.googleapis.com/youtube/v3/videos", {
        params: {
          id: videoId,
          key: this.youtubeApiKey,
          fields:
            "items(snippet/title,contentDetails/duration,statistics/viewCount)",
          part: "snippet,contentDetails,statistics",
        },
      });
      return response.data.items[0];
    } catch (error) {
      return undefined;
    }
  }
}
