import axios from "axios";
import ytdl from "ytdl-core";
import type { Initializable } from "./ObjectManager";
import Logger from "./Logger";

export interface SongDetails {
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

export default class YouTubeClient implements Initializable {
	constructor(private readonly youtubeApiKey: string) {}

	public async init(): Promise<void> {
		Logger.info(`Initializing the ${this.constructor.name}...`);
		Logger.info(`Initialized the ${this.constructor.name}!`);
	}

	public async getSongIdByName(name: string): Promise<string | undefined> {
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

	public async getSongDetailsById(
		videoId: string,
	): Promise<SongDetails | undefined> {
		try {
			const response = await axios.get<{ items: SongDetails[] }>(
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
		} catch (error: unknown) {
			return undefined;
		}
	}

	public async downloadYouTubeAudio(
		audioId: string,
	): Promise<string | undefined> {
		const { promise, resolve, reject } = Promise.withResolvers<string | undefined>();
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

		return promise;
	}
}
