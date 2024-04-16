import axios from "axios";
import ytdl from "ytdl-core";
import type { Initializable } from "./ObjectManager";

export interface VideoDetail {
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

export default class YoutubeClient implements Initializable {
	constructor(private readonly youtubeApiKey: string) {}

	public async init(): Promise<void> {
		console.log("Initializing the YoutubeClient...");
		console.log("Initialized the YoutubeClient!");
	}

	public async getVideoIdByName(name: string): Promise<string | undefined> {
		try {
			const response = await axios.get<{
				items: [
					{
						id: {
							videoId: string;
						};
					},
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
			return undefined;
		}
	}

	public async getVideoDetailsById(
		videoId: string,
	): Promise<VideoDetail | undefined> {
		try {
			const response = await axios.get<{ items: VideoDetail[] }>(
				"https://www.googleapis.com/youtube/v3/videos",
				{
					params: {
						id: videoId,
						key: this.youtubeApiKey,
						fields:
							"items(snippet/title,contentDetails/duration,statistics/viewCount)",
						part: "snippet,contentDetails,statistics",
					},
				},
			);

			//YouTube Data API likes to return an empty list with 200 status code
			if (!response.data.items.length)
				throw new Error("YouTube Data API has returned an empty item list");

			return response.data.items[0];
		} catch (error) {
			return undefined;
		}
	}

	public async downloadYouTubeAudio(
		audioId: string,
	): Promise<string | undefined> {
		return new Promise((resolve, reject) => {
			const buffers: Buffer[] = [];
			ytdl(`https://www.youtube.com/watch?v=${audioId}`, {
				quality: "highestaudio",
				filter: "audioonly",
			})
				.on("data", (chunk: Buffer) => {
					buffers.push(chunk);
				})
				.on("end", () => {
					const data = Buffer.concat(buffers);
					resolve(`data:audio/mp3;base64,${data.toString("base64")}`);
				})
				.on("error", () => {
					reject(undefined);
				});
		});
	}
}
