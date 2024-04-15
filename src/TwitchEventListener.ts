import { EventSubWsListener } from "@twurple/eventsub-ws";
import { Initializable } from "./ObjectManager";
import { Namespace, Server as SocketIO } from "socket.io";
import TwitchClient from "./TwitchClient";
import { UserIdResolvable } from "@twurple/api";
export default class TwitchEventListener implements Initializable {
  private eventSub!: EventSubWsListener;

  constructor(
    private readonly socketIO: SocketIO,
    private readonly twitchClient: TwitchClient,
  ) {}

  private getTwitchEventNamespace(): Namespace<any> {
    return this.socketIO.of("twitch-alerts");
  }

  public async init(): Promise<void> {
    console.log("Initializing the TwitchEventListener...");

    try {
      const broadcasterId: UserIdResolvable = await this.twitchClient.getApiClient().asIntent(["events"], async (ctx) => {
        return (await ctx.getTokenInfo()).userId as string
      });

      if(!broadcasterId) {
        throw new Error("Could not get the broadcaster id from an access token");
      }

      this.eventSub = new EventSubWsListener({
        apiClient: this.twitchClient.getApiClient(),
      });

      this.setEventListeners(broadcasterId);
      this.eventSub.start();

      console.log("Initialized the TwitchEventListener!");
    } catch (e: unknown) {
      if(e instanceof Error) {
        console.log(`\x1b[31mFailed to initialize the TwitchEventListener class, reason: ${e.message}\x1b[0m`);
      }
    }
  }
  
  private setEventListeners(broadcasterId: UserIdResolvable): void {
    this.eventSub.onChannelSubscription(broadcasterId, (e) => {
      const username = e.userDisplayName;

      this.getTwitchEventNamespace().emit("twitch-alert-message", {
        type: "FIRST_SUB",
        username,
      });

    });

    this.eventSub.onChannelSubscriptionMessage(broadcasterId, (e) => {
      const username = e.userDisplayName;
      const subStreakInMonths = e.streakMonths ?? 0;

      this.getTwitchEventNamespace().emit("twitch-alert-message", {
        type: "RE_SUB",
        username,
        subStreakInMonths,
      });
    });
  }
}
