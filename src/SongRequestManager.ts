import type { Namespace, Server as SocketIO } from "socket.io";
import type { Initializable } from "./ObjectManager";
import type YoutubeClient from "./YoutubeClient";

export class SongRequestError extends Error {
	public constructor(message: string) {
		super(message);
		this.name = "SongRequestError";
	}
}

export interface Song {
	videoId: string;
	title: string;
	durationInSeconds: number;
	addedBy: string;
}

export default class SongRequestManager implements Initializable {
	private readonly REQUEST_TIMEOUT = 1_400;
	private songQueue: Song[] = [];

	constructor(
		private readonly youTubeClient: YoutubeClient,
		private readonly socketIO: SocketIO,
	) {}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	private getSongRequestNamespace(): Namespace<any> {
		return this.socketIO.of("/song-request");
	}

	public async init(): Promise<void> {
		console.log("Initializing the SongRequestManager...");

		this.getSongRequestNamespace().on("connection", (socket) => {
			socket.on(
				"request-from-frontend",
				(request: {
					type: string;
				}) => {
					switch (request.type) {
						case "GET_NEXT_SONG":
							this.sendSongFromQueue();
							break;
						default:
							break;
					}
				},
			);
		});

		console.log("Initialized the SongRequestManager!");
	}

	public addSongToQueue(song: Song): number {
		return this.songQueue.push(song);
	}

	public playSong(): void {
		this.getSongRequestNamespace().emit("song-request-message", {
			type: "PLAY",
		});
	}

	public pauseSong(): void {
		this.getSongRequestNamespace().emit("song-request-message", {
			type: "PAUSE",
		});
	}

	public skipSong(): void {
		this.getSongRequestNamespace().emit("song-request-message", {
			type: "SKIP_SONG",
		});
	}

	public async changeSongVolume(
		volumeValue: string,
	): Promise<number | undefined> {
		try {
			const response = await this.getSongRequestNamespace()
				.timeout(this.REQUEST_TIMEOUT)
				.emitWithAck("song-request-message", {
					type: "CHANGE_VOLUME",
					volumeValue,
				});

			return response[0].newVolume;
		} catch (e: unknown) {
			return undefined;
		}
	}

	public getFirstNSongsFromQueue(n: number): Song[] {
		return this.songQueue.slice(0, n);
	}

	private async getDurationOfCurrentPlayingSong(): Promise<number> {
		try {
			const sockets = await this.getSongRequestNamespace().fetchSockets();

			const response: {
				durationInSeconds: number;
			} = await sockets[0]
				.timeout(this.REQUEST_TIMEOUT)
				.emitWithAck("song-request-message", {
					type: "SONG_DURATION",
				});

			return response.durationInSeconds;
		} catch (e: unknown) {
			return 0;
		}
	}

	public async getDurationOfSongs(): Promise<number> {
		let queueDurationInSeconds: number = this.songQueue
			.map((s) => s.durationInSeconds)
			.reduce((acc, s) => acc + s, 0);

		queueDurationInSeconds += await this.getDurationOfCurrentPlayingSong();

		return queueDurationInSeconds;
	}

	public async sendSongFromQueue(): Promise<void> {
		const song: Song | undefined = this.removeSongFromQueue();
		if (!song) return;

		const audioData: string | undefined =
			await this.youTubeClient.downloadYouTubeAudio(song.videoId);
		if (!audioData) return;

		this.getSongRequestNamespace().emit("song-request-message", {
			type: "PLAY_NEXT_SONG",
			data: {
				title: song.title,
				audio: audioData,
			},
		});
	}

	public removeSongFromQueue(): Song | undefined {
		return this.songQueue.shift();
	}
}
