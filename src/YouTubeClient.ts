import axios from "axios";
import ytdl from "ytdl-core";
import type { Initializable } from "./ObjectManager";
import * as Logger from "./Logger";

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
		Logger.trace("Entering getSongIdByName() method");
		Logger.debug("GetSongIdByName method's parameters", {
			parameters: {
				name,
			},
		});
		try {
			Logger.trace("Making a GET API call");
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

			Logger.debug("API call response", {
				status: response.statusText,
				data: response.data,
			});

			return response.data.items[0].id.videoId;
		} catch (error: unknown) {
			if (error instanceof Error) {
				Logger.debug("API call threw error", {
					errorName: error.name,
					errorMessage: error.message,
					stack: error.stack,
				});
			}
			return undefined;
		} finally {
			Logger.trace("Exiting getSongIdByName() method");
		}
	}

	public async getSongDetailsById(
		songId: string,
	): Promise<SongDetails | undefined> {
		Logger.trace("Entering getSongDetailsById() method");
		Logger.debug("GetSongDetailsById method's parameters", {
			parameters: {
				songId,
			},
		});
		try {
			Logger.trace("Making a GET API call");
			const response = await axios.get<{ items: SongDetails[] }>(
				"https://www.googleapis.com/youtube/v3/videos",
				{
					params: {
						id: songId,
						key: this.youtubeApiKey,
						fields:
							"items(snippet/title,contentDetails/duration,statistics/viewCount)",
						part: "snippet,contentDetails,statistics",
					},
				},
			);

			Logger.debug("API call response", {
				status: response.statusText,
				data: response.data,
			});

			//YouTube Data API likes to return an empty list with 200 status code
			if (!response.data.items.length)
				throw new Error("YouTube Data API returned an empty item list");

			return response.data.items[0];
		} catch (error: unknown) {
			if (error instanceof Error) {
				Logger.debug("API call threw error", {
					errorName: error.name,
					errorMessage: error.message,
					stack: error.stack,
				});
			}
			return undefined;
		} finally {
			Logger.trace("Exiting getSongDetailsById() method");
		}
	}

	public async downloadYouTubeAudio(
		audioId: string,
	): Promise<string | undefined> {
		Logger.trace("Entering downloadYouTubeAudio() method");
		Logger.debug("DownloadYouTubeAudio method's parameters", {
			parameters: {
				audioId,
			},
		});
		const { promise, resolve, reject } = Promise.withResolvers<
			string | undefined
		>();
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

				Logger.debug("Ended fetching audio chunks", {
					audioId,
					fetchedChunks: buffers.length,
				});

				resolve(`data:audio/mp3;base64,${data.toString("base64")}`);
			})
			.on("error", (err) => {
				Logger.error("Failed to fetch audio from YouTube", {
					audioId,
					fetchedChunks: buffers.length,
					errorMessage: err.message,
					errorName: err.name,
					stack: err.stack,
				});

				reject(undefined);
			});

		Logger.trace("Exiting downloadYouTubeAudio() method");
		return promise;
	}
}
