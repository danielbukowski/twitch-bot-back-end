import type { RefreshingAuthProvider } from "@twurple/auth";
import { ChatClient, type ChatMessage, ChatUser } from "@twurple/chat";
import { Duration } from "luxon";
import type { UserType } from "./ConfigInitializer";
import type { Initializable } from "./ObjectManager";
import type SongRequestManager from "./SongRequestManager";
import type { Song } from "./SongRequestManager";
import { SongRequestError } from "./SongRequestManager";
import type TwitchClient from "./TwitchClient";
import type YoutubeClient from "./YoutubeClient";
import type { VideoDetail } from "./YoutubeClient";
import ytdl from "ytdl-core";

export function HasRole(roles: UserType[]) {
	return function actualDecorator(
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		decoratedMethod: any,
		context: ClassMethodDecoratorContext,
	) {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		return function (this: any, ...args: any[]) {
			const userInfo: ChatUser = args[args.length - 1];

			if (!(userInfo instanceof ChatUser)) {
				throw new Error(
					`The method '${
						context.name as string
					}' with hasRole decorator does not have ChatUser parameter as the last method parameter!`,
				);
			}

			if (!roles.length) {
				return decoratedMethod.call(this, ...args);
			}

			for (const roleName of roles) {
				if (userInfo[`is${roleName}`]) {
					return decoratedMethod.call(this, ...args);
				}
			}
		};
	};
}

export interface CommandContainer {
	getCommands(): Map<string, BasicCommand>;
}

export type BasicCommand = (
	chatClient: ChatClient,
	channelName: string,
	commandParameters: string[],
	userInfo: ChatUser,
) => Promise<unknown>;

export default class TwitchChat implements Initializable {
	private readonly COMMAND_PREFIX: string = "!";
	private readonly MIN_VIDEO_VIEWS: number = 18_000;
	private readonly MAX_VIDEO_DURATION_IN_SECONDS: number = 360;
	private chatClient!: ChatClient;
	private chatbotName!: string;

	public constructor(
		private readonly authProvider: RefreshingAuthProvider,
		private readonly youtubeClient: YoutubeClient,
		private readonly songRequestManager: SongRequestManager,
		private readonly twitchClient: TwitchClient,
	) {
		this.authProvider = authProvider;
		this.youtubeClient = youtubeClient;
		this.songRequestManager = songRequestManager;
	}

	public async init(): Promise<void> {
		console.log("Initializing the TwitchChat...");

		try {
			this.chatbotName = await this.twitchClient
				.getApiClient()
				.asIntent(["chat"], async (ctx) => {
					return (await ctx.getTokenInfo()).userName as string;
				});

			if (!this.chatbotName) {
				throw new Error("Could not get the bot name from an access token");
			}

			const broadcasterChannelName: string = await this.twitchClient
				.getApiClient()
				.asIntent(["events"], async (ctx) => {
					return (await ctx.getTokenInfo()).userName as string;
				});

			if (!broadcasterChannelName) {
				throw new Error(
					"Could not get the broadcaster channel name from an access token",
				);
			}

			this.chatClient = new ChatClient({
				authProvider: this.authProvider,
				channels: [broadcasterChannelName],
				webSocket: true,
				authIntents: ["chat"],
			});

			this.setChatListeners();
			this.chatClient.connect();

			console.log("Initialized the TwitchChat!");
		} catch (e: unknown) {
			if (e instanceof Error) {
				console.log(
					`\x1b[31mFailed to initialize the TwitchChat class, reason: ${e.message}\x1b[0m`,
				);
			}
		}
	}

	private setChatListeners(): void {
		this.chatClient.onDisconnect(() => {
			console.log("I have been disconnected from the chat :(");
		});

		this.chatClient.onJoin((channel: string, user: string) => {
			console.log("I have connected to the chat! :)");
			this.chatClient.say(channel, "I have connected to the chat! :)");
		});

		this.chatClient.onMessage(
			async (channel: string, user: string, text: string, msg: ChatMessage) => {
				const message = text.trim();

				if (
					!message.startsWith(this.COMMAND_PREFIX) ||
					user === this.chatbotName
				)
					return;

				const [commandName, ...commandParameters] = message.split(" ");

				const userInfo: ChatUser = msg.userInfo;

				switch (commandName.toLowerCase()) {
					case `${this.COMMAND_PREFIX}hello`:
						this.chatClient.say(channel, `Hello @${user}`);
						break;
					case `${this.COMMAND_PREFIX}sr`:
						this.handleAddSongToQueueCommand(
							channel,
							commandParameters,
							userInfo,
						);
						break;
					case `${this.COMMAND_PREFIX}srskipsong`:
						this.handleSkipSongCommand(userInfo);
						break;
					case `${this.COMMAND_PREFIX}srpause`:
						this.handlePauseSongRequestCommand(userInfo);
						break;
					case `${this.COMMAND_PREFIX}srvolume`:
						await this.handleChangeSongRequestVolumeCommand(
							commandParameters,
							channel,
							userInfo,
						);
						break;
					case `${this.COMMAND_PREFIX}srq`:
						this.handleDisplaySongRequestQueueCommand(channel, userInfo);
						break;
					case `${this.COMMAND_PREFIX}srplay`:
						this.handleStartSongRequestCommand(userInfo);
						break;
					case `${this.COMMAND_PREFIX}whenmysong`:
						await this.handleDisplayInfoAboutMySongCommand(channel, userInfo);
						break;
					case `${this.COMMAND_PREFIX}wrongsong`:
						this.handleDeleteMyEarliestSongFromQueueCommand(channel, userInfo);
						break;
					default:
						break;
				}
			},
		);
	}

	private handleStartSongRequestCommand(userInfo: ChatUser): void {
		this.songRequestManager.playSong();
	}

	private handleSkipSongCommand(userInfo: ChatUser): void {
		this.songRequestManager.skipSong();
	}

	private handlePauseSongRequestCommand(userInfo: ChatUser): void {
		this.songRequestManager.pauseSong();
	}

	public handleDeleteMyEarliestSongFromQueueCommand(
		channel: string,
		userInfo: ChatUser,
	) {
		try {
			const deletedSong = this.songRequestManager.deleteUserTheEaliestSong(
				userInfo.userName,
			);

			this.chatClient.say(
				channel,
				`Your song '${deletedSong.title}' has been succesfully deleted!`,
			);
		} catch (e: unknown) {
			if (e instanceof SongRequestError) {
				this.chatClient.say(channel, e.message);
			} else if (e instanceof Error) {
				this.chatClient.say(
					channel,
					"Something went wrong when trying to delete your song :/",
				);
			}
		}
	}

	public async handleDisplayInfoAboutMySongCommand(
		channel: string,
		userInfo: ChatUser,
	): Promise<void> {
		try {
			const song =
				await this.songRequestManager.getTheHighestSongDetailByUsername(
					userInfo.userName,
				);

			const unitOfTimes: string[] = this.convertDurationInSecondsToUnitsOfTime(
				song.playingIn,
			);

			this.chatClient.say(
				channel,
				`You song '${song.title}' will be played in ~ ${
					!unitOfTimes.length ? "now" : unitOfTimes.join(" and ")
				}`,
			);
		} catch (e: unknown) {
			if (e instanceof SongRequestError) {
				this.chatClient.say(channel, e.message);
			} else if (e instanceof Error) {
				this.chatClient.say(channel, "Something went wrong :/");
			}
		}
	}

	private async handleAddSongToQueueCommand(
		channel: string,
		commandParameters: string[],
		userInfo: ChatUser,
	): Promise<void> {
		const songRequestParameters: string = commandParameters.join(" ");

		if (!songRequestParameters) {
			return;
		}

		try {
			let videoId: string | undefined;

			if (ytdl.validateURL(songRequestParameters)) {
				videoId = ytdl.getURLVideoID(songRequestParameters);
			} else {
				videoId = await this.youtubeClient.getVideoIdByName(
					songRequestParameters,
				);
			}

			if (videoId === undefined)
				throw new SongRequestError("Sorry, but I Could not find your song :(");

			const songDetail: VideoDetail | undefined =
				await this.youtubeClient.getVideoDetailsById(videoId);

			if (songDetail === undefined)
				throw new SongRequestError("Sorry, but I cannot add this song :(");

			if (
				Number.parseInt(songDetail.statistics.viewCount) < this.MIN_VIDEO_VIEWS
			)
				throw new SongRequestError("Your song has not enough views!");

			const durationInSeconds: number = Duration.fromISO(
				songDetail.contentDetails.duration,
			).as("seconds");

			if (durationInSeconds > this.MAX_VIDEO_DURATION_IN_SECONDS)
				throw new SongRequestError("Your song is too long :(");

			const songsDurationInSeconds: number =
				await this.songRequestManager.getDurationOfSongs();

			const title = songDetail.snippet.title;

			const positionInQueue: number = this.songRequestManager.addSongToQueue({
				videoId,
				title,
				durationInSeconds,
				addedBy: userInfo.userName,
			});

			const unitsOfTime: string[] = this.convertDurationInSecondsToUnitsOfTime(
				songsDurationInSeconds,
			);

			this.chatClient.say(
				channel,
				`'${title}' added to the queue at #${positionInQueue} position! (playing in ~ ${
					!unitsOfTime.length ? "now" : unitsOfTime.join(" and ")
				})`,
			);
		} catch (e: unknown) {
			if (e instanceof SongRequestError) {
				this.chatClient.say(channel, e.message);
			} else if (e instanceof Error) {
				this.chatClient.say(channel, "Something is wrong with your song :|");
			}
		}
	}

	private async handleChangeSongRequestVolumeCommand(
		commandParameters: string[],
		channel: string,
		userInfo: ChatUser,
	): Promise<void> {
		const volumeValue: string = commandParameters[0];
		const regExpToVolume: RegExp = /^[+-]?(\d{1,2}|100)$/;

		if (!volumeValue || !volumeValue.match(regExpToVolume)) return;

		const newVolume: number | undefined =
			await this.songRequestManager.changeSongVolume(volumeValue);

		if (newVolume === undefined) return;

		this.chatClient.say(
			channel,
			`The volume has been set to ${newVolume * 100}%`,
		);
	}

	private handleDisplaySongRequestQueueCommand(
		channel: string,
		userInfo: ChatUser,
	): void {
		const first3SongsInQueue: Song[] =
			this.songRequestManager.getFirstNSongsFromQueue(3);

		if (!first3SongsInQueue.length) {
			this.chatClient.say(channel, "No songs have been found in the queue :(");
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

		this.chatClient.say(channel, response);
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

	public getUserRole(userInfo: ChatUser): UserType | "Normal" {
		const roles: UserType[] = [
			"Mod",
			"Subscriber",
			"Vip",
			"Broadcaster",
			"Artist",
			"Founder",
		];

		for (const roleName of roles) {
			if (userInfo[`is${roleName}`]) {
				return roleName;
			}
		}

		return "Normal";
	}
}
