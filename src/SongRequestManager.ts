import type { Namespace, Server as SocketIO } from "socket.io";
import type { Initializable } from "./ObjectManager";
import type YoutubeClient from "./YoutubeClient";
import type { UserType } from "./ConfigInitializer";
import TwitchChat, { type BasicCommand, HasRole } from "./TwitchChat";
import type { ChatClient, ChatUser } from "@twurple/chat";
import { Duration } from "luxon/src/duration";
import type { VideoDetail } from "./YoutubeClient";
import ytdl from "ytdl-core";

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
	private readonly MAXIMUM_SONG_DURATION_FOR_USER_TYPE: Record<
		UserType | "Normal",
		number
	> = {
		Mod: 2137,
		Subscriber: 2137,
		Vip: 2137,
		Broadcaster: 2137,
		Artist: 2137,
		Founder: 2137,
		Normal: 2137,
	};
	private readonly MINIMAL_SONG_VIEWS_FOR_USER_TYPE: Record<
		UserType | "Normal",
		number
	> = {
		Mod: 2137,
		Subscriber: 2137,
		Vip: 2137,
		Broadcaster: 2137,
		Artist: 2137,
		Founder: 2137,
		Normal: 2137,
	};

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

	@HasRole(["Broadcaster"])
	public async playSongRequest(
		chatClient: ChatClient,
		channelName: string,
		commandParameters: string[],
		userInfo: ChatUser,
	): Promise<void> {
		this.getSongRequestNamespace().emit("song-request-message", {
			type: "PLAY",
		});
	}

	@HasRole(["Broadcaster"])
	public async pauseSongRequest(
		chatClient: ChatClient,
		channelName: string,
		commandParameters: string[],
		userInfo: ChatUser,
	): Promise<void> {
		this.getSongRequestNamespace().emit("song-request-message", {
			type: "PAUSE",
		});
	}

	@HasRole(["Broadcaster", "Mod"])
	public async skipSong(
		chatClient: ChatClient,
		channelName: string,
		commandParameters: string[],
		userInfo: ChatUser,
	): Promise<void> {
		this.getSongRequestNamespace().emit("song-request-message", {
			type: "SKIP_SONG",
		});
	}

	@HasRole(["Broadcaster", "Mod"])
	public async ChangeSongRequestVolume(
		chatClient: ChatClient,
		channelName: string,
		commandParameters: string[],
		userInfo: ChatUser,
	): Promise<void> {
		const volume: string = commandParameters[0];
		const regExpToVolume: RegExp = /^[+-]?(\d{1,2}|100)$/;

		if (!volume || !volume.match(regExpToVolume)) return;

		const response = await this.getSongRequestNamespace()
			.timeout(this.REQUEST_TIMEOUT)
			.emitWithAck("song-request-message", {
				type: "CHANGE_VOLUME",
				volumeValue: volume,
			});

		const newVolume = response[0].newVolume;

		chatClient.say(
			channelName,
			`The volume has been set to ${newVolume * 100}%`,
		);
	}

	public getFirstNSongsFromQueue(n: number): Song[] {
		return this.songQueue.slice(0, n);
	}

	public async getInfoAboutCurrentlyPlayingSong(): Promise<
		Omit<Song, "videoId">
	> {
		const socket = (await this.getSongRequestNamespace().fetchSockets())[0];

		if (!socket) {
			throw new Error("No one is connected to the song request!");
		}

		const response: Omit<Song, "videoId"> = await socket
			.timeout(this.REQUEST_TIMEOUT)
			.emitWithAck("song-request-message", {
				type: "SONG_DURATION",
			});

		return response;
	}

	public async getDurationOfSongs(): Promise<number> {
		let queueDurationInSeconds: number = this.songQueue
			.map((s) => s.durationInSeconds)
			.reduce((acc, s) => acc + s, 0);

		queueDurationInSeconds += (await this.getInfoAboutCurrentlyPlayingSong())
			.durationInSeconds;

		return queueDurationInSeconds;
	}

	public async sendSongFromQueue(): Promise<void> {
		const song: Song | undefined = this.removeSongFromQueue();
		if (!song) {
			this.getSongRequestNamespace().emit("song-request-message", {
				type: "PLAY_NEXT_SONG",
				error: {
					message: "EMPTY_QUEUE",
				},
			});
			return;
		}

		const audioData: string | undefined =
			await this.youTubeClient.downloadYouTubeAudio(song.videoId);

		if (!audioData) {
			this.getSongRequestNamespace().emit("song-request-message", {
				type: "PLAY_NEXT_SONG",
				error: {
					message: "DOWNLOADING_ERROR",
				},
			});
			return;
		}

		this.getSongRequestNamespace().emit("song-request-message", {
			type: "PLAY_NEXT_SONG",
			data: {
				title: song.title,
				addedBy: song.addedBy,
				audio: audioData,
			},
		});
	}

	@HasRole([])
	public async displaySongDetailsOfTheLatestAddedSongByUser(
		chatClient: ChatClient,
		channelName: string,
		commandParameters: string[],
		userInfo: ChatUser,
	): Promise<void> {
		const userName = userInfo.userName;

		if (!this.songQueue.length) {
			throw new SongRequestError("The queue is empty");
		}

		const songIndex: number = this.songQueue.findIndex(
			(s) => s.addedBy === userName,
		);

		const song: Song | undefined = this.songQueue.at(songIndex);

		if (!song) {
			throw new SongRequestError("Can't find any your song in the queue");
		}

		let playingIn = this.getFirstNSongsFromQueue(songIndex)
			.map((s) => s.durationInSeconds)
			.reduce((acc, s) => acc + s, 0);
		playingIn += (await this.getInfoAboutCurrentlyPlayingSong())
			.durationInSeconds;

		const unitOfTimes: string[] =
			this.convertDurationInSecondsToUnitsOfTime(playingIn);

		chatClient.say(
			channelName,
			`@${userName} your song '${song.title}' will be played in ~ ${
				!unitOfTimes.length ? "now" : unitOfTimes.join(" and ")
			}`,
		);
	}

	@HasRole([])
	public async displaySongRequestQueue(
		chatClient: ChatClient,
		channelName: string,
		commandParameters: string[],
		userInfo: ChatUser,
	): Promise<void> {
		const first3SongsInQueue: Song[] = this.getFirstNSongsFromQueue(3);

		if (!first3SongsInQueue.length) {
			chatClient.say(
				channelName,
				`@${userInfo.userName} no songs have been found in the queue :(`,
			);
			return;
		}

		let response = `Current ${
			first3SongsInQueue.length === 1 ? "song" : "songs"
		} in the queue: `;

		for (let index = 0; index < first3SongsInQueue.length; index++) {
			const song = first3SongsInQueue[index];
			response += `#${index + 1} '${
				song.title
			}' https://www.youtube.com/watch?v=${song.videoId} added by @${
				song.addedBy
			}, `;
		}
		response = response.slice(0, -2);

		chatClient.say(channelName, response);
	}

	@HasRole([])
	public async addUserSongToQueue(
		chatClient: ChatClient,
		channelName: string,
		commandParameters: string[],
		userInfo: ChatUser,
	): Promise<void> {
		const joinedRequestParameters: string = commandParameters.join(" ");

		if (!joinedRequestParameters) {
			return;
		}

		let videoId: string | undefined;

		if (ytdl.validateURL(joinedRequestParameters)) {
			videoId = ytdl.getURLVideoID(joinedRequestParameters);
		} else {
			videoId = await this.youTubeClient.getVideoIdByName(
				joinedRequestParameters,
			);
		}

		if (!videoId)
			throw new SongRequestError("Sorry, but I Could not find your song :(");

		const songDetail: VideoDetail | undefined =
			await this.youTubeClient.getVideoDetailsById(videoId);

		if (!songDetail)
			throw new SongRequestError("Sorry, but I cannot add this song :(");

		const userType = TwitchChat.getUserRole(userInfo);

		if (
			Number.parseInt(songDetail.statistics.viewCount) <
			this.MINIMAL_SONG_VIEWS_FOR_USER_TYPE[userType]
		)
			throw new SongRequestError("Your song has not enough views!");

		const durationInSeconds: number = Duration.fromISO(
			songDetail.contentDetails.duration,
		).as("seconds");

		if (durationInSeconds >= this.MAXIMUM_SONG_DURATION_FOR_USER_TYPE[userType])
			throw new SongRequestError("Your song is too long :(");

		const songsDurationInSeconds: number = await this.getDurationOfSongs();
		const songTitle = songDetail.snippet.title;

		const positionInQueue: number = this.addSongToQueue({
			videoId,
			title: songTitle,
			durationInSeconds,
			addedBy: userInfo.userName,
		});

		const unitsOfTime: string[] = this.convertDurationInSecondsToUnitsOfTime(
			songsDurationInSeconds,
		);

		chatClient.say(
			channelName,
			`'${songTitle}' added to the queue at #${positionInQueue} position! (playing in ~ ${
				!unitsOfTime.length ? "now" : unitsOfTime.join(" and ")
			})`,
		);
	}

	@HasRole([])
	public async deleteUserTheEarliestAddedSong(
		chatClient: ChatClient,
		channelName: string,
		commandParameters: string[],
		userInfo: ChatUser,
	): Promise<void> {
		const userName = userInfo.userName;

		const songIndex: number = this.songQueue.findLastIndex(
			(song) => song.addedBy === userName,
		);

		if (songIndex === -1) {
			throw new SongRequestError("Can't find any your song in the queue");
		}

		const deletedSong = this.songQueue.splice(songIndex, 1)[0];

		chatClient.say(
			channelName,
			`Your song '${deletedSong.title}' has been succesfully deleted! @${userName}`,
		);
	}

	public removeSongFromQueue(): Song | undefined {
		return this.songQueue.shift();
	}

	private convertDurationInSecondsToUnitsOfTime(
		durationInSeconds: number,
	): string[] {
		let duration: number = durationInSeconds;

		if (!duration) {
			return [];
		}

		const hours = Math.floor(duration / 3600);
		if (hours >= 1) {
			duration %= 3600;
		}

		const minutes = Math.floor(duration / 60);
		if (minutes >= 1) {
			duration %= 60;
		}

		const seconds = duration;

		const unitsOfTime: string[] = [];

		if (hours > 0) {
			if (hours === 1) {
				unitsOfTime.push("1 hour");
			} else {
				unitsOfTime.push(`${hours} hours`);
			}
		}

		if (minutes > 0) {
			if (minutes === 1) {
				unitsOfTime.push("1 minute");
			} else {
				unitsOfTime.push(`${minutes} minutes`);
			}
		}

		if (seconds > 0) {
			if (seconds === 1) {
				unitsOfTime.push("1 second");
			} else {
				unitsOfTime.push(`${seconds} seconds`);
			}
		}
		return unitsOfTime;
	}
}
