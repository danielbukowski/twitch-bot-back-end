import type { UserIdResolvable } from "@twurple/api";
import { EventSubWsListener } from "@twurple/eventsub-ws";
import type { Namespace, Server as SocketIO } from "socket.io";
import type { Initializable } from "./ObjectManager";
import type TwitchClient from "./TwitchClient";
import Logger from "./Logger";
export default class TwitchEventListener implements Initializable {
	private eventSub!: EventSubWsListener;

	constructor(
		private readonly socketIO: SocketIO,
		private readonly twitchClient: TwitchClient,
	) {}

	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	private getTwitchEventNamespace(): Namespace<any> {
		return this.socketIO.of("twitch-alerts");
	}

	public async init(): Promise<void> {
		Logger.info(`Initializing the ${this.constructor.name}...`);

		try {
			const broadcasterId: UserIdResolvable = await this.twitchClient
				.getApiClient()
				.asIntent(["events"], async (ctx) => {
					return (await ctx.getTokenInfo()).userId as string;
				});

			if (!broadcasterId) {
				throw new Error(
					"Could not get the broadcaster id from an access token",
				);
			}

			this.eventSub = new EventSubWsListener({
				apiClient: this.twitchClient.getApiClient(),
			});

			this.setEventListeners(broadcasterId);
			this.eventSub.start();

			Logger.info(`Initialized the ${this.constructor.name}!`);
		} catch (e: unknown) {
			if (e instanceof Error) {
				Logger.error(
					`Failed to initialize the TwitchEventListener class, reason: ${e.message}`,
				);
			}
		}
	}

	private setEventListeners(broadcasterId: UserIdResolvable): void {
		this.eventSub.onChannelSubscription(broadcasterId, (e) => {
			const username: string = e.userDisplayName;

			this.getTwitchEventNamespace().emit("payload", {
				type: "FIRST_SUB",
				username,
			});
		});

		this.eventSub.onChannelSubscriptionMessage(broadcasterId, (e) => {
			const username: string = e.userDisplayName;
			const subStreakInMonths: number = e.streakMonths ?? 0;

			this.getTwitchEventNamespace().emit("payload", {
				type: "RE_SUB",
				username,
				subStreakInMonths,
			});
		});
	}
}
