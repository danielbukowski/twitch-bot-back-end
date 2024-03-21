import { EventSubWsListener } from "@twurple/eventsub-ws";
import ManageableClass from "./ManageableClass";
import SocketServer from "./SocketServer";
import TwitchClient from "./TwitchClient";

export default class TwitchEventListener implements ManageableClass {
  private eventSub!: EventSubWsListener;

  constructor(
    private readonly socketServer: SocketServer,
    private readonly twitchClient: TwitchClient,
  ) {}

  async init(): Promise<void> {
    console.log("Initializing the TwitchEventListener...");

    this.eventSub = new EventSubWsListener({
      apiClient: this.twitchClient.getApiClient(),
    });

    const channelId: string =
      await this.twitchClient.getIdFromAccessTokenForIntent("events");

    this.eventSub.onChannelSubscription(channelId, (e) => {
      const userName = e.userDisplayName;

      this.socketServer.handleFirstSubscription(userName);
    });

    this.eventSub.onChannelSubscriptionMessage(channelId, (e) => {
      const userName = e.userDisplayName;
      const subStreakInMonths = e.streakMonths ?? 0;

      this.socketServer.handleResubscription(userName, subStreakInMonths);
    });

    this.eventSub.start();

    console.log("Initialized the TwitchEventListener!");
  }
}
