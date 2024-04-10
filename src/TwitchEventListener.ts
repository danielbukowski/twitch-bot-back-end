import { EventSubWsListener } from "@twurple/eventsub-ws";
import { Initializable } from "./ObjectManager";
import SocketServer from "./SocketServer";
import TwitchClient from "./TwitchClient";

export default class TwitchEventListener implements Initializable {
  private eventSub!: EventSubWsListener;

  constructor(
    private readonly socketServer: SocketServer,
    private readonly twitchClient: TwitchClient,
  ) {}

  public async init(): Promise<void> {
    console.log("Initializing the TwitchEventListener...");

    this.eventSub = new EventSubWsListener({
      apiClient: this.twitchClient.getApiClient(),
    });

    const channelId: string =
      await this.twitchClient.getIdFromAccessTokenForIntent("events");

    this.eventSub.onChannelSubscription(channelId, (e) => {
      const userName = e.userDisplayName;

      this.socketServer.getSocketIO().emit("twitch-alert-message", {
        type: "FIRST_SUB",
        username,
      });

    });

    this.eventSub.onChannelSubscriptionMessage(channelId, (e) => {
      const userName = e.userDisplayName;
      const subStreakInMonths = e.streakMonths ?? 0;

      this.socketServer.getSocketIO().emit("twitch-alert-message", {
        type: "RE_SUB",
        username,
        subStreakInMonths,
      });
    });

    this.eventSub.start();

    console.log("Initialized the TwitchEventListener!");
  }
}
