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
